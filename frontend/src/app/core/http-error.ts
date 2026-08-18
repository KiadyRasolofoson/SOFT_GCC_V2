import { HttpErrorResponse } from '@angular/common/http';

export type LoginErrorKind = 'auth' | 'network' | 'license' | 'validation';

export interface LoginError {
  kind: LoginErrorKind;
  message: string;
  suggestion: string;
}

function serverMessage(err: HttpErrorResponse): string {
  const data = err.error;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    const msg = data.message ?? data.Message ?? data.title ?? data.error;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return '';
}

export function loginErrorFromHttp(err: unknown): LoginError {
  if (!(err instanceof HttpErrorResponse)) {
    return {
      kind: 'auth',
      message: 'Une erreur inattendue est survenue.',
      suggestion: 'Réessayez. Si le problème persiste, contactez le support technique.',
    };
  }

  if (err.status === 0) {
    return {
      kind: 'network',
      message: 'Impossible de vous connecter. Le serveur est injoignable.',
      suggestion:
        'Vérifiez que votre connexion internet fonctionne et que le serveur est accessible.',
    };
  }

  const data = err.error;
  const isLicense =
    err.status === 403 &&
    (data?.error === 'license_invalid' || Boolean(data?.reason));

  if (isLicense) {
    return {
      kind: 'license',
      message: 'Impossible de vous connecter car la licence n’est plus valide.',
      suggestion: 'Contactez votre administrateur pour la renouveler.',
    };
  }

  if (err.status === 401) {
    const msg = serverMessage(err);
    return {
      kind: 'auth',
      message:
        msg.length > 5
          ? msg
          : 'Identifiant ou mot de passe incorrect. Vérifiez vos informations de connexion.',
      suggestion:
        'Vérifiez vos identifiants et réessayez. Si vous avez oublié votre mot de passe, contactez votre administrateur.',
    };
  }

  return {
    kind: 'network',
    message: serverMessage(err) || 'Impossible de vous connecter en raison d’une erreur du serveur.',
    suggestion: 'Réessayez dans quelques instants. Si le problème persiste, contactez le support.',
  };
}
