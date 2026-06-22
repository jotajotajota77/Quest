// ============================================================
// Notificações do timer de descanso (PWA). Estratégia em camadas:
//  1. TimestampTrigger (se suportado): a notificação é AGENDADA e dispara no
//     horário certo mesmo com o app fechado/congelado (Chrome/Android).
//  2. Fallback: mostra a notificação quando o timer zera com o app vivo
//     (foreground ou ao voltar). Em iOS exige app na tela inicial + permissão.
// Tudo falha em silêncio: o timer visual + bip continuam funcionando.
// ============================================================

const TAG = "quest-rest-timer";
const TITULO = "⏱ Quest — descanso";
const CORPO = "Acabou o descanso. Bora pra próxima série! 💪";

type Triggerable = NotificationOptions & { showTrigger?: unknown };

export function notifSuportada(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function notifPermitida(): boolean {
  return notifSuportada() && Notification.permission === "granted";
}

/** Pede permissão (deve ser chamado a partir de um gesto do usuário). */
export async function pedirPermissaoNotif(): Promise<boolean> {
  if (!notifSuportada()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function opcoes(extra?: Partial<Triggerable>): Triggerable {
  return {
    body: CORPO,
    tag: TAG,
    icon: "/icon.svg",
    badge: "/icon.svg",
    ...extra,
  };
}

/**
 * Agenda a notificação para `fimEm` via TimestampTrigger, se o navegador
 * suportar. Retorna true se conseguiu agendar (entregue mesmo com app fechado).
 */
export async function agendarDescanso(fimEm: number): Promise<boolean> {
  try {
    if (!notifPermitida()) return false;
    const Trigger = (window as unknown as { TimestampTrigger?: new (t: number) => unknown })
      .TimestampTrigger;
    if (!Trigger || !("showTrigger" in Notification.prototype)) return false;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(TITULO, opcoes({ showTrigger: new Trigger(fimEm) }));
    return true;
  } catch {
    return false;
  }
}

/** Mostra a notificação AGORA (fallback quando o timer zera com app vivo). */
export async function notificarDescanso(): Promise<void> {
  try {
    if (!notifPermitida()) return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(TITULO, opcoes({ renotify: true } as Partial<Triggerable>));
  } catch {
    /* silencioso */
  }
}

/** Cancela qualquer notificação agendada/exibida do timer (ao cancelar). */
export async function cancelarDescanso(): Promise<void> {
  try {
    if (!notifSuportada()) return;
    const reg = await navigator.serviceWorker.ready;
    const getN = reg.getNotifications as (
      f?: Record<string, unknown>,
    ) => Promise<Notification[]>;
    const ns = await getN.call(reg, { tag: TAG, includeTriggered: true });
    ns.forEach((n) => n.close());
  } catch {
    /* silencioso */
  }
}
