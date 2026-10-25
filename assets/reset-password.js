/*
 * Page « mot de passe oublie » et « invitation » (25 octobre).
 *
 * Supabase redirige ici apres le clic dans l'e-mail, avec dans le fragment
 * (#...) : access_token, refresh_token et type (recovery ou invite). Le
 * fragment n'est jamais envoye a un serveur ; la page l'efface de la barre
 * d'adresse des la lecture, puis ferme la session une fois le mot de passe
 * enregistre. Memes regles que l'app : 8 caracteres au moins, confirmation
 * identique. L'indicateur de force conseille, il ne bloque pas.
 *
 * Trois etats : formulaire, succes, lien expire ou invalide.
 */
(function () {
  'use strict'

  var el = function (id) { return document.getElementById(id) }

  function afficherEtat(nom) {
    ['formulaire', 'succes', 'expire'].forEach(function (e) {
      el('etat-' + e).classList.toggle('actif', e === nom)
    })
  }

  // Lecture du fragment, puis effacement : rien ne reste dans l'historique.
  var fragment = window.location.hash.replace(/^#/, '')
  var params = new URLSearchParams(fragment)
  if (fragment) history.replaceState(null, '', window.location.pathname)

  var accessToken = params.get('access_token')
  var refreshToken = params.get('refresh_token')
  var invitation = params.get('type') === 'invite'

  function lienExpire() {
    if (invitation) {
      el('texte-expire').textContent = "Ce lien d'invitation n'est plus valable. Demandez à votre responsable de vous renvoyer l'invitation depuis l'app."
    }
    afficherEtat('expire')
  }

  var erreurLien = params.get('error_description') || new URLSearchParams(window.location.search).get('error_description')
  var config = window.KONFORME_CONFIG || {}
  if (erreurLien || !accessToken || !refreshToken || !config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
    return lienExpire()
  }

  if (invitation) {
    el('titre').textContent = 'Choisissez votre mot de passe'
    el('intro').textContent = 'Bienvenue sur Konforme. Choisissez le mot de passe de votre compte.'
  }
  afficherEtat('formulaire')

  // Sur telephone : le meme lien peut ouvrir l'app, qui sait le traiter.
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    el('ouvrir-app').href = 'konforme://reinitialiser-mot-de-passe#' + fragment
    el('ouvrir-app').classList.remove('cache')
  }

  // Afficher / masquer.
  Array.prototype.forEach.call(document.querySelectorAll('.afficher'), function (b) {
    b.addEventListener('click', function () {
      var champ = el(b.getAttribute('data-cible'))
      var visible = champ.type === 'text'
      champ.type = visible ? 'password' : 'text'
      b.textContent = visible ? 'Afficher' : 'Masquer'
    })
  })

  // Indicateur de force (conseil seulement).
  var NIVEAUX = [
    { texte: 'Trop court : 8 caractères minimum', couleur: 'var(--red)' },
    { texte: 'Faible', couleur: 'var(--red)' },
    { texte: 'Moyen', couleur: 'var(--orange)' },
    { texte: 'Bon', couleur: 'var(--teal)' },
    { texte: 'Fort', couleur: 'var(--green)' },
  ]
  function force(mdp) {
    if (mdp.length < 8) return 0
    var score = 1
    if (mdp.length >= 12) score++
    if (/[a-z]/.test(mdp) && /[A-Z]/.test(mdp)) score++
    if (/\d/.test(mdp) && /[^A-Za-z0-9]/.test(mdp)) score++
    return Math.min(score, 4)
  }
  var barres = document.querySelectorAll('.force-barres span')
  el('nouveau').addEventListener('input', function () {
    var mdp = el('nouveau').value
    var n = mdp ? force(mdp) : -1
    Array.prototype.forEach.call(barres, function (b, i) {
      b.style.background = n >= 0 && i < Math.max(n, 1) ? NIVEAUX[n].couleur : ''
    })
    el('force-texte').textContent = n >= 0 ? NIVEAUX[n].texte : ''
  })

  var client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  function erreur(texte, champ) {
    el('erreur').textContent = texte
    el('nouveau').classList.toggle('erreur', champ === 'nouveau')
    el('confirmation').classList.toggle('erreur', champ === 'confirmation')
  }

  var bouton = el('enregistrer')
  el('formulaire').addEventListener('submit', function (e) {
    e.preventDefault()
    var nouveau = el('nouveau').value
    var confirmation = el('confirmation').value
    if (nouveau.length < 8) return erreur('Le mot de passe doit contenir au moins 8 caractères.', 'nouveau')
    if (nouveau !== confirmation) return erreur('Les deux mots de passe ne correspondent pas.', 'confirmation')
    erreur('')

    bouton.disabled = true
    bouton.textContent = 'Enregistrement…'

    client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(function (res) {
        if (res.error) throw { lien: true }
        return client.auth.updateUser({ password: nouveau })
      })
      .then(function (res) {
        if (res.error) throw res.error
        return client.auth.signOut({ scope: 'local' }).catch(function () {})
      })
      .then(function () {
        afficherEtat('succes')
      })
      .catch(function (err) {
        bouton.disabled = false
        bouton.textContent = 'Enregistrer le mot de passe'
        var code = err && err.code
        if (err && err.lien) return lienExpire()
        if (code === 'same_password') return erreur("Le nouveau mot de passe doit être différent de l'ancien.", 'nouveau')
        if (code === 'weak_password') return erreur('Mot de passe trop faible : choisissez-en un plus long ou plus varié.', 'nouveau')
        erreur("L'enregistrement n'a pas abouti. Vérifiez votre connexion et réessayez.")
      })
  })
})()
