import React, { useState } from "react";
import { Button, Form, Card, Row, Col, Dropdown } from "react-bootstrap";
import Icon from "@mdi/react";
import { mdiPlus, mdiDelete, mdiEye, mdiFormatListBulleted } from "@mdi/js";

const DocumentPreview = () => {
  const [sections, setSections] = useState([
    { id: 1, title: "Introduction", content: "Bienvenue {{Nom}}, aujourd’hui nous sommes le {{Date}}." },
  ]);
  const [variables] = useState(["Nom", "Date", "Poste", "Société"]);
  const [formData, setFormData] = useState({ Nom: "Jean Dupont", Date: "02/04/2025", Poste: "Développeur", Société: "TechCorp" });
  const [showPreview, setShowPreview] = useState(false);

  // Ajouter une nouvelle section
  const addSection = () => {
    setSections([...sections, { id: sections.length + 1, title: "", content: "" }]);
  };

  // Supprimer une section
  const removeSection = (id) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  // Mettre à jour une section
  const updateSection = (id, key, value) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, [key]: value } : section
      )
    );
  };

  // Insérer un champ dynamique dans le texte
  const insertVariable = (id, variable) => {
    setSections(
      sections.map((section) =>
        section.id === id
          ? { ...section, content: section.content + ` {{${variable}}}` }
          : section
      )
    );
  };

  // Générer un aperçu avec les variables remplies
  const generatePreview = (content) => {
    return content.replace(/\{\{(.*?)\}\}/g, (_, key) => formData[key] || `{{${key}}}`);
  };

  return (
    <div className="container mt-4">
      <h2>📌 Gestion de contenu dynamique</h2>

      {sections.map((section) => (
        <Card key={section.id} className="mb-3 shadow-sm p-3">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Titre</Form.Label>
                <Form.Control
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, "title", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Contenu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={section.content}
                  onChange={(e) => updateSection(section.id, "content", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end gap-2">
              <Dropdown onSelect={(variable) => insertVariable(section.id, variable)}>
                <Dropdown.Toggle variant="secondary">
                  <Icon path={mdiFormatListBulleted} size={1} className="me-2" />
                  Ajouter champ
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {variables.map((variable) => (
                    <Dropdown.Item key={variable} eventKey={variable}>
                      {variable}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="danger" onClick={() => removeSection(section.id)}>
                <Icon path={mdiDelete} size={1} />
              </Button>
            </Col>
          </Row>
        </Card>
      ))}

      {/* Boutons d'action */}
      <div className="mt-3 d-flex gap-2">
        <Button variant="success" onClick={addSection}>
          <Icon path={mdiPlus} size={1} className="me-2" />
          Ajouter une section
        </Button>

        <Button variant="info" onClick={() => setShowPreview(true)}>
          <Icon path={mdiEye} size={1} className="me-2" />
          Voir l'aperçu
        </Button>
      </div>

      {/* Aperçu du contenu */}
      {showPreview && (
        <Card className="mt-4 p-3 shadow-sm">
          <h4>Aperçu du document</h4>
          {sections.map((section) => (
            <div key={section.id} className="mb-3">
              <h5>{section.title || "Titre vide"}</h5>
              <p>{generatePreview(section.content)}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default DocumentPreview;
