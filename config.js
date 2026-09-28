/*
 * GrihaPravesam — event configuration.
 *
 * This file is what your guests see. Edit it by hand, or use config.html
 * (the visual editor) and press "Export config.js", then replace this file
 * and redeploy.
 *
 *   lang     – default language for guests: "te" (Telugu) or "en" (English).
 *              A guest link can override it with &l=en or &l=te.
 *   siteUrl  – the public address where this folder is hosted, e.g.
 *              "https://yourname.github.io/GrihaPravesam/". QR codes point here.
 *              Leave empty to use whatever address the poster page is opened from.
 */
window.GP_CONFIG = {
  "lang": "te",
  "siteUrl": "",
  "event": {
    "start": "2025-07-28T08:00",
    "durationMinutes": 180,
    "mapUrl": "https://maps.google.com/?q=123+Anywhere+St",
    "showMapQr": false
  },
  "music": {
    "enabled": true,
    "url": "",
    "volume": 0.5
  },
  "posterTheme": "cream",
  "blessingPhoto": "",
  "schedule": [
    { "time": "06:00", "te": "గణపతి పూజ", "en": "Ganapathi Puja" },
    { "time": "07:30", "te": "గృహప్రవేశం", "en": "Griha Pravesam" },
    { "time": "09:00", "te": "సత్యనారాయణ వ్రతం", "en": "Satyanarayana Vratam" },
    { "time": "12:30", "te": "భోజనాలు", "en": "Lunch" }
  ],
  "text": {
    "te": {
      "welcome": "సుస్వాగతం",
      "dear": "ఆత్మీయ ఆహ్వానం",
      "guestFallback": "ఆత్మీయ బంధుమిత్రులకు",
      "tapHint": "తలుపు తెరవడానికి తాకండి",
      "topLine": "శ్రీరస్తు • శుభమస్తు • అవిఘ్నమస్తు",
      "title1": "గృహప్రవేశ",
      "title2": "మహోత్సవం",
      "subLine": "సకుటుంబ సమేతంగా విచ్చేసి ఆశీర్వదించగలరు",
      "month": "జూలై",
      "day": "28",
      "year": "2025",
      "weekday": "ఆదివారం",
      "time": "ఉదయం 8 గం.",
      "atLabel": "వేదిక",
      "address": "123, ఏనీవేర్ స్ట్రీట్, ఏనీ సిటీ, ST 12345",
      "hostsLabel": "ఆహ్వానించువారు",
      "hosts": "శ్రీమతి & శ్రీ రావు గారి కుటుంబం",
      "posterFor": "ప్రత్యేక ఆహ్వానం",
      "posterScan": "మీ ఆహ్వాన పత్రిక కోసం స్కాన్ చేయండి",
      "mapQrCaption": "దారి కోసం స్కాన్ చేయండి",
      "lightDiya": "దీపం వెలిగించి లోపలికి రండి",
      "countdownPill": "ఇంకా {d} రోజులు · {h} గంటలు",
      "countdownTitle": "శుభ ముహూర్తానికి ఇంకా",
      "countdownToday": "ఈరోజే శుభదినం!",
      "countdownDone": "మా నూతన గృహాన్ని ఆశీర్వదించినందుకు ధన్యవాదాలు",
      "unitDays": "రోజులు",
      "unitHours": "గంటలు",
      "unitMinutes": "నిమిషాలు",
      "unitSeconds": "సెకన్లు",
      "scheduleTitle": "కార్యక్రమ వివరాలు",
      "blessingTitle": "పెద్దల ఆశీస్సులు",
      "blessings": "మీ రాక మాకు అదృష్టం, మీ ఆశీస్సులు మాకు బలం.\nకొత్త ఇంట్లో తొలి దీపం మీ సమక్షంలో వెలగాలని మా కోరిక.\nమీ అందరి ఆశీర్వాదంతో ఈ శుభకార్యం సంపూర్ణం.",
      "blessingFrom": "— రావు కుటుంబం",
      "scrollHint": "మరిన్ని వివరాలు",
      "directions": "దారి",
      "calendar": "క్యాలెండర్",
      "replay": "మళ్ళీ"
    },
    "en": {
      "welcome": "Welcome",
      "dear": "A special invitation for",
      "guestFallback": "Our Dear Family & Friends",
      "tapHint": "Tap the door to enter",
      "topLine": "Join us for",
      "title1": "Griha Pravesh",
      "title2": "Ceremony",
      "subLine": "of our new home on",
      "month": "July",
      "day": "28",
      "year": "2025",
      "weekday": "Sunday",
      "time": "At 8 AM",
      "atLabel": "at",
      "address": "123 Anywhere St, Any City, ST 12345",
      "hostsLabel": "With love",
      "hosts": "The Rao Family",
      "posterFor": "Specially for",
      "posterScan": "Scan to open your invitation",
      "mapQrCaption": "Scan for directions",
      "lightDiya": "Light the diya to enter",
      "countdownPill": "{d} days · {h} hrs to go",
      "countdownTitle": "Counting down to the auspicious hour",
      "countdownToday": "Today is the day!",
      "countdownDone": "Thank you for blessing our new home",
      "unitDays": "Days",
      "unitHours": "Hours",
      "unitMinutes": "Minutes",
      "unitSeconds": "Seconds",
      "scheduleTitle": "Order of the day",
      "blessingTitle": "Blessings from the family",
      "blessings": "Your presence is our good fortune, your blessings our strength.\nWe wish to light the first lamp of our new home with you beside us.\nWith all your blessings, this celebration will be complete.",
      "blessingFrom": "— The Rao Family",
      "scrollHint": "More details",
      "directions": "Directions",
      "calendar": "Save date",
      "replay": "Replay"
    }
  }
};
