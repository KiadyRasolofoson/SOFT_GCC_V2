#!/usr/bin/env python3
"""Applique le contenu métier du référentiel de compétences via l'API `api/skill-referential`.

Idempotent : les familles sont retrouvées par (domaine, nom), les compétences par nom,
les matrices sont remplacées poste par poste.

Passer par l'API (et non par SQL) conserve les règles du domaine : validateur de
publication, unicité des noms actifs, création de `Skill_version`, journal d'activité.

Usage :
    SOFTGCC_USER=... SOFTGCC_PASSWORD=... python3 seed_referentiel.py [--api http://localhost:5189/api] [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from referentiel_contenu import (  # noqa: E402
    ARCHETYPES,
    ARCHIVE_SKILLS,
    BASELINE,
    FAMILIES,
    KEYWORD_PACKS,
    KIND_MAP,
    POSITION_PACKS,
    SKILLS,
    SKIP_SKILLS,
    elide,
)

RANK_LABELS = {1: "Notions", 2: "Application", 3: "Maîtrise", 4: "Expert"}


class Api:
    def __init__(self, base: str, token: str | None = None) -> None:
        self.base = base.rstrip("/")
        self.token = token

    def call(self, method: str, path: str, payload=None):
        url = f"{self.base}{path}"
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(url, data=data, method=method)
        request.add_header("Content-Type", "application/json")
        if self.token:
            request.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(request) as response:
                body = response.read().decode()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as error:
            detail = error.read().decode()[:400]
            raise RuntimeError(f"{method} {path} -> {error.code} {detail}") from None


def login(api: Api, identifier: str, password: str) -> str:
    result = api.call("POST", "/Authentification/login", {"identifier": identifier, "password": password})
    token = (result or {}).get("token")
    if not token:
        raise RuntimeError("Authentification impossible : aucun jeton renvoyé.")
    return token


def descriptors_for(name: str, spec: dict) -> list[dict]:
    if "levels" in spec:
        texts = spec["levels"]
    else:
        template = ARCHETYPES[spec["archetype"]]
        texts = [
            line.format(name=name, de_name=elide(name), objet=spec["objet"])
            for line in template
        ]
    return [
        {"rank": rank, "label": RANK_LABELS[rank], "behavioralDefinition": text}
        for rank, text in zip((1, 2, 3, 4), texts)
    ]


def flatten_catalog(catalog: list[dict]) -> dict[str, dict]:
    skills: dict[str, dict] = {}
    for domain in catalog:
        for family in domain.get("families") or []:
            for skill in family.get("skills") or []:
                skills[skill["name"]] = skill
    return skills


def strongest(rows: list[tuple[str, str, int]]) -> list[tuple[str, str, int]]:
    """Déduplique par compétence en gardant l'exigence la plus forte puis le niveau le plus haut."""
    priority = {"C": 3, "R": 2, "D": 1}
    best: dict[str, tuple[str, int]] = {}
    for skill_name, kind, level in rows:
        current = best.get(skill_name)
        if current is None or (priority[kind], level) > (priority[current[0]], current[1]):
            best[skill_name] = (kind, level)
    return [(name, kind, level) for name, (kind, level) in best.items()]


def pack_for(position_name: str) -> list[tuple[str, str, int]]:
    explicit = POSITION_PACKS.get(position_name)
    if explicit is not None:
        return strongest(explicit + BASELINE)
    needle = position_name.lower()
    for keywords, pack in KEYWORD_PACKS:
        if any(keyword in needle for keyword in keywords):
            return strongest(pack + BASELINE)
    return strongest(list(BASELINE))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default=os.environ.get("SOFTGCC_API", "http://localhost:5189/api"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-matrix", action="store_true")
    parser.add_argument(
        "--republish",
        action="store_true",
        help="Republier les compétences déjà actives (crée une nouvelle version si le sens a changé).",
    )
    args = parser.parse_args()

    identifier = os.environ.get("SOFTGCC_USER")
    password = os.environ.get("SOFTGCC_PASSWORD")
    if not identifier or not password:
        print("SOFTGCC_USER et SOFTGCC_PASSWORD sont requis (compte Admin ou RH).", file=sys.stderr)
        return 2

    api = Api(args.api)
    api.token = login(api, identifier, password)

    domains = {row["name"]: row["id"] for row in api.call("GET", "/skill-referential/domains")}
    families = api.call("GET", "/skill-referential/families")
    family_ids = {(row.get("domainId"), row["name"]): row["id"] for row in families}

    created_families = 0
    for domain_name, family_name, description in FAMILIES:
        domain_id = domains.get(domain_name)
        if domain_id is None:
            print(f"  ! domaine absent, famille ignorée : {domain_name} / {family_name}")
            continue
        if (domain_id, family_name) in family_ids:
            continue
        if args.dry_run:
            print(f"  + famille (dry-run) {domain_name} / {family_name}")
            family_ids[(domain_id, family_name)] = 0
            created_families += 1
            continue
        created = api.call(
            "POST",
            "/skill-referential/families",
            {
                "domainId": domain_id,
                "name": family_name,
                "description": description,
                "sortOrder": created_families + 1,
            },
        )
        family_ids[(domain_id, family_name)] = created["id"]
        created_families += 1
        print(f"  + famille {created['code']} {domain_name} / {family_name}")

    family_by_name = {name: fid for (_domain, name), fid in family_ids.items()}

    catalog = flatten_catalog(api.call("GET", "/skill-referential/catalog"))
    published, updated, missing = 0, 0, []
    for skill_name, spec in SKILLS.items():
        existing = catalog.get(skill_name)
        if existing is None:
            missing.append(skill_name)
            continue
        family_id = family_by_name.get(spec["family"])
        if family_id is None:
            print(f"  ! famille inconnue pour {skill_name} : {spec['family']}")
            continue
        payload = {
            "name": skill_name,
            "definition": spec["definition"],
            "category": spec["category"],
            "familyId": family_id,
            "descriptors": descriptors_for(skill_name, spec),
        }
        if args.dry_run:
            updated += 1
            continue
        try:
            api.call("PUT", f"/skill-referential/skills/{existing['skillId']}", payload)
            updated += 1
            if existing.get("state") != "Active" or args.republish:
                api.call("POST", f"/skill-referential/skills/{existing['skillId']}/publish", {})
                published += 1
        except RuntimeError as error:
            print(f"  ! {skill_name} : {error}")

    archived = 0
    for skill_name in ARCHIVE_SKILLS:
        existing = catalog.get(skill_name)
        if existing and existing.get("state") != "Archived":
            if not args.dry_run:
                api.call("POST", f"/skill-referential/skills/{existing['skillId']}/archive", {})
            archived += 1

    matrix_positions, matrix_rows = 0, 0
    if not args.skip_matrix:
        catalog = flatten_catalog(api.call("GET", "/skill-referential/catalog"))
        try:
            positions = api.call("GET", "/Position")
        except RuntimeError as error:
            print(f"  ! matrice ignorée (GET /Position) : {error}")
            positions = []
        for position in positions:
            position_id = position.get("positionId") or position.get("PositionId")
            position_name = position.get("positionName") or position.get("PositionName") or ""
            rows = []
            for skill_name, kind, level in pack_for(position_name):
                skill = catalog.get(skill_name)
                if skill is None or skill.get("state") != "Active":
                    continue
                rows.append(
                    {
                        "skillId": skill["skillId"],
                        "expectedLevel": level,
                        "requirementKind": KIND_MAP[kind],
                        "weight": 1,
                    }
                )
            if not rows:
                continue
            if not args.dry_run:
                api.call("PUT", f"/skill-referential/positions/{position_id}/skills", rows)
            matrix_positions += 1
            matrix_rows += len(rows)

    print()
    print(f"Familles créées         : {created_families}")
    print(f"Compétences complétées  : {updated}")
    print(f"Compétences publiées    : {published}")
    print(f"Compétences archivées   : {archived}")
    print(f"Compétences ignorées    : {sorted(SKIP_SKILLS)}")
    print(f"Postes outillés         : {matrix_positions} ({matrix_rows} lignes de matrice)")
    if missing:
        print(f"Absentes du catalogue   : {missing}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
