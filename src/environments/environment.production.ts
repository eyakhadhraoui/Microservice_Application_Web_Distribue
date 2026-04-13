export const environment = {
  production: true,
  /**
   * Front servi ailleurs que le dev server (ex. Tomcat sur :80) : appeler la gateway explicitement.
   * Adapter l’hôte si la gateway n’est pas sur la même machine.
   */
  projetApiRoot: 'http://localhost:8095/projet',
};
