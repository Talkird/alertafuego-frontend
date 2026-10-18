/** Shared by the Terms and Privacy pages. */
export const LEGAL = {
  /** Shown as the people responsible for the service. Empty: the project team. */
  team: [] as string[],
  contactEmail: "alertafuego26@gmail.com",
  updated: "18 de octubre de 2026",
};

/** "Juan Pérez y Ana Gómez, del Proyecto..." or the team when no names are set. */
export function legalResponsible(): string {
  const project =
    "Proyecto Final de Ingeniería en Informática de la Universidad Argentina de la Empresa (UADE)";
  const names = LEGAL.team;
  if (!names.length) return `el equipo de AlertaFuego, ${project}`;
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
  return `${list}, integrantes del ${project}`;
}
