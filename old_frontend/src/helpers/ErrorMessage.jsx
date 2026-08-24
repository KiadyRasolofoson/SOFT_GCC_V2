import { useState, useEffect, useCallback } from "react";
import { getUserMessage } from "./errorHandler";

const ICONS = {
  network: "mdi mdi-wifi-off",
  timeout: "mdi mdi-clock-alert-outline",
  auth: "mdi mdi-account-key-outline",
  forbidden: "mdi mdi-shield-lock-outline",
  notFound: "mdi mdi-file-search-outline",
  server: "mdi mdi-server-network-off",
  license: "mdi mdi-certificate-outline",
  validation: "mdi mdi-alert-circle-outline",
  conflict: "mdi mdi-source-branch",
  rateLimit: "mdi mdi-timer-sand",
  badRequest: "mdi mdi-alert-outline",
  unknown: "mdi mdi-alert-octagon-outline",
  canceled: "mdi mdi-cancel",
};

const SEVERITY_CLASSES = {
  error: "alert-danger",
  warning: "alert-warning",
  info: "alert-info",
};

/**
 * Affiche un message d'erreur contextualisé et compréhensible pour l'utilisateur.
 *
 * @param {*}      error          - L'erreur brute
 * @param {string} [context]      - Contexte: "chargement", "insertion", "modification", "suppression", "connexion", etc.
 * @param {string} [mode="banner"] - "banner" | "inline" | "toast"
 * @param {number} [autoDismiss]  - Délai en ms avant fermeture auto (0 = pas d'auto-dismiss). Défaut: 0 pour banner/inline, 8000 pour toast.
 * @param {function} onDismiss    - Callback appelé quand l'utilisateur ferme
 * @param {function} onRetry      - Callback affiché en bouton "Réessayer"
 */
export default function ErrorMessage({
  error,
  context = "chargement",
  mode = "banner",
  autoDismiss,
  onDismiss,
  onRetry,
}) {
  const [dismissed, setDismissed] = useState(false);

  const defaultAutoDismiss = mode === "toast" ? 8000 : 0;
  const dismissAfter = autoDismiss !== undefined ? autoDismiss : defaultAutoDismiss;

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    setDismissed(false);
  }, [error]);

  useEffect(() => {
    if (!dismissAfter || dismissed) return;
    const timer = setTimeout(handleDismiss, dismissAfter);
    return () => clearTimeout(timer);
  }, [dismissAfter, dismissed, handleDismiss]);

  if (!error || dismissed) return null;

  const msg = getUserMessage(error, context);
  const icon = ICONS[msg.type] || ICONS.unknown;
  const alertClass = SEVERITY_CLASSES[msg.severity] || "alert-danger";

  if (mode === "toast") {
    return (
      <div className={`error-toast ${alertClass}`} role="alert">
        <div className="error-toast__body">
          <i className={`${icon} error-toast__icon`}></i>
          <div className="error-toast__content">
            <strong className="error-toast__title">{msg.title}</strong>
            <span className="error-toast__message">{msg.message}</span>
            {msg.suggestion && (
              <span className="error-toast__suggestion">{msg.suggestion}</span>
            )}
          </div>
          <button
            className="error-toast__close"
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        {onRetry && (
          <div className="error-toast__actions">
            <button className="btn btn-sm btn-outline-light" onClick={onRetry}>
              <i className="mdi mdi-refresh me-1"></i>
              Réessayer
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === "inline") {
    return (
      <div className={`error-inline ${alertClass}`} role="alert">
        <div className="error-inline__body">
          <i className={`${icon} error-inline__icon`}></i>
          <div className="error-inline__content">
            <span className="error-inline__message">{msg.message}</span>
            {msg.suggestion && (
              <span className="error-inline__suggestion">{msg.suggestion}</span>
            )}
          </div>
          <div className="error-inline__actions">
            {onRetry && (
              <button
                className="btn btn-sm btn-link error-inline__retry"
                onClick={onRetry}
                title="Réessayer"
              >
                <i className="mdi mdi-refresh"></i>
              </button>
            )}
            <button
              className="error-inline__close"
              onClick={handleDismiss}
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // mode === "banner" (défaut)
  return (
    <div className={`error-banner ${alertClass}`} role="alert">
      <div className="error-banner__body">
        <i className={`${icon} error-banner__icon fs-4 me-3`}></i>
        <div className="error-banner__content">
          <strong className="error-banner__title">{msg.title}</strong>
          <p className="error-banner__message mb-1">{msg.message}</p>
          {msg.suggestion && (
            <p className="error-banner__suggestion">
              <i className="mdi mdi-lightbulb-outline me-1"></i>
              {msg.suggestion}
            </p>
          )}
        </div>
        <div className="error-banner__actions">
          {onRetry && (
            <button className="btn btn-outline-light btn-sm me-2" onClick={onRetry}>
              <i className="mdi mdi-refresh me-1"></i>
              Réessayer
            </button>
          )}
          <button
            className="error-banner__close"
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
