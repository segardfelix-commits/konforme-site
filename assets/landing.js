'use strict';
/* Site de presentation Konforme : menu, et formulaire « Etre recontacte »
   (masque pour l'instant). Aucun script en ligne dans la page : politique de
   securite. */

// ============ NAV ============
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Envoi par la fonction contact-form (e-mail via Resend, 3 demandes par
// heure et par adresse IP). Le creneau va dans le message.
function submitCallback() {
  const val = id => document.getElementById(id).value.trim();
  const erreur = document.getElementById('cbErreur');
  const name = val('cbName'), etab = val('cbEtab'), email = val('cbEmail'), phone = val('cbPhone'), slot = val('cbSlot');
  if (!name || !etab || !email || !phone) {
    erreur.textContent = 'Merci de renseigner votre nom, votre établissement, votre e-mail et votre téléphone.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erreur.textContent = 'Adresse e-mail invalide.';
    return;
  }
  const config = window.KONFORME_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    erreur.textContent = "L'envoi est indisponible pour le moment. Réessayez plus tard.";
    return;
  }
  const message = 'Demande de rappel depuis konforme.app\n'
    + 'Créneau préféré : ' + (slot || 'non précisé');
  const bouton = document.getElementById('btnEnvoyer');
  bouton.disabled = true;
  erreur.textContent = '';
  fetch(config.supabaseUrl + '/functions/v1/contact-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': config.supabaseAnonKey, 'Authorization': 'Bearer ' + config.supabaseAnonKey },
    body: JSON.stringify({ nomEtablissement: etab, nomContact: name, email: email, telephone: phone, message: message }),
  })
    .then(res => res.json().catch(() => ({})).then(corps => ({ ok: res.ok, corps })))
    .then(({ ok, corps }) => {
      if (!ok) throw new Error(corps && corps.error ? corps.error : "L'envoi n'a pas abouti. Réessayez.");
      document.getElementById('callbackForm').classList.remove('visible');
      document.getElementById('callbackSuccess').classList.add('visible');
    })
    .catch(e => {
      bouton.disabled = false;
      erreur.textContent = e && e.message && e.message !== 'Failed to fetch' ? e.message : "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez.";
    });
}

document.getElementById('btnEnvoyer').addEventListener('click', submitCallback);
