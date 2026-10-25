# konforme-site

Pages publiques de konforme.app, publiées par GitHub Pages.

- `reset-password/` : mot de passe oublié et invitation (lien des e-mails Supabase).
- `index.html` : site de présentation (formulaire « Être recontacté » prêt mais masqué).
- `mentions-legales/`, `confidentialite/` : pages légales (la seconde sert aussi pour l'App Store et le Play Store).

Sécurité :
- `config.js` ne contient que l'adresse de la base et la clé **publique** (anon) Supabase, déjà présente dans l'app. Jamais de clé de service, Resend ou autre.
- Aucun script ni police externe : la bibliothèque Supabase (assets/) et la police Plus Jakarta Sans (assets/fonts, licence OFL) sont copiées ici. Chaque page déclare une Content-Security-Policy.
