// Malayalam edition (Manglish): Malayalam grammar, with the English maker words people actually say kept in English.
// Same keys and markup as topics.mjs (*accent*, ~strike~); asm/label/chapter/sources come from the English file.
// A Malayalam suffix after an English word starts with a full letter ("project-ൽ", "Campus-കളിൽ"), never a bare vowel sign.
// Rendered with: node build.mjs --lang=ml (Malayalam letters in Baloo Chettan 2, Latin in Bricolage).
export const TOPICS_ML = {
  "01-maker-faire-101": {
    slides: [
      { lines: ["എന്താണ് ഈ", "*Maker Faire?*"] },
      { lines: ["ഇതൊരു", "~conference~", "അല്ല."] },
      { lines: ["Things make", "ചെയ്യുന്നവരുടെ", "ഒരു വലിയ", "*show-and-tell.*"] },
      { lines: ["വെറുതെ", "കണ്ടുനിൽക്കേണ്ട.", "*Try ചെയ്യൂ.*"], cta: true },
    ],
    caption: "ഇതൊരു conference അല്ല. Things make ചെയ്യുന്നവരുടെ ഒരു വലിയ show-and-tell. ഇവിടെ വെറുതെ കണ്ടുനിൽക്കേണ്ട, നിങ്ങളും try ചെയ്യൂ.\nMaker Faire Kochi ഉടൻ വരുന്നു. 🛠️",
  },
  "02-kerala-already-makes": {
    slides: [
      { lines: ["“Maker” എന്ന", "word വരുന്നതിനും", "*മുമ്പേ…*"] },
      { lines: ["…കേരളം", "പണ്ടേ", "*make ചെയ്യുന്നുണ്ട്.*"] },
      { lines: ["Repair shop-കളിൽ.", "അടുക്കളകളിൽ.", "Campus-കളിൽ.", "*Workshop-കളിൽ.*"] },
      { lines: ["ഇനി അതിനൊരു", "*stage.*"], cta: true },
    ],
    caption: "“Maker” എന്ന word വരുന്നതിനും മുമ്പേ കേരളം make ചെയ്യുന്നുണ്ട്: repair shop-കളിലും അടുക്കളകളിലും campus-കളിലും workshop-കളിലും. ഇനി അതിനൊരു stage.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "03-not-just-tech": {
    slides: [
      { lines: ["Making =", "~coding?~"] },
      { lines: ["Woodwork. പാചകം.", "Repairing. പാട്ട്.", "Fashion. *Art.*"] },
      { lines: ["പിന്നെ,", "*coding-ഉം.*"], cta: true },
    ],
    caption: "Making എന്നാൽ coding മാത്രമാണോ? അല്ല. Woodwork, പാചകം, repairing, പാട്ട്, fashion, art… പിന്നെ, coding-ഉം.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "04-who-counts-as-a-maker": {
    slides: [
      { lines: ["ആരാണ് ഒരു", "*maker?*"] },
      { lines: ["Degree വേണ്ട.", "Lab വേണ്ട.", "*Permission-ഉം വേണ്ട.*"] },
      { lines: ["എന്തെങ്കിലും make", "ചെയ്യുന്നുണ്ടോ?", "*നിങ്ങളും maker ആണ്.*"], cta: true },
    ],
    caption: "Degree വേണ്ട. Lab വേണ്ട. Permission-ഉം വേണ്ട. എന്തെങ്കിലും make ചെയ്യുന്നുണ്ടെങ്കിൽ, നിങ്ങളും ഒരു maker ആണ്.\nMaker Faire Kochi ഉടൻ വരുന്നു. 🔧",
  },
  "05-repair-is-making": {
    slides: [
      { lines: ["Fan fix ചെയ്തോ?", "Bag stitch ചെയ്തോ?", "Lamp *rewire ചെയ്തോ?*"] },
      { lines: ["അതും", "*making ആണ്.*"], cta: true },
    ],
    caption: "Fan fix ചെയ്തോ? Bag stitch ചെയ്തോ? Lamp rewire ചെയ്തോ? അതും making ആണ്. 🪛\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "06-version-one": {
    slides: [
      { lines: ["എല്ലാ maker-നും", "work ആകാത്ത ഒരു", "*version ഉണ്ട്.*"] },
      { lines: ["തെറ്റിയ circuit.", "പൊട്ടിയ print.", "*കരിഞ്ഞുപോയ*", "*first batch.*"] },
      { lines: ["അത്", "~failure~ അല്ല.", "അത് *version 1.*"] },
      { lines: ["എന്ത് മാറി എന്ന്", "വന്ന് *കാണിക്കൂ.*"], cta: true },
    ],
    caption: "എല്ലാ maker-നും work ആകാത്ത ഒരു version ഉണ്ട്: തെറ്റിയ circuit, പൊട്ടിയ print, കരിഞ്ഞുപോയ first batch. അത് failure അല്ല, version 1 ആണ്.\nഎന്ത് മാറി എന്ന് വന്ന് കാണിക്കൂ. Maker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "07-kuttimakers": {
    slides: [
      { lines: ["Build ചെയ്യാൻ", "എത്ര", "*വയസ്സാകണം?*"] },
      { lines: ["School projects.", "ആദ്യ experiments.", "*വലിയ curiosity.*"] },
      { lines: ["Building-ന്", "age ഒരു", "*barrier അല്ല.*"], cta: true },
    ],
    caption: "Build ചെയ്യാൻ എത്ര വയസ്സാകണം? School projects, ആദ്യ experiments, വലിയ curiosity. Building-ന് age ഒരു barrier അല്ല. 🧒\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  // Maker Stories (video series) is not out yet, so the sign-off says it is coming rather than "meet them in".
  "08-maker-stories": {
    slides: [
      { lines: ["ഓരോ project-ന്റെ", "പിന്നിലും ഒരു", "*മനുഷ്യനുണ്ട്.*"] },
      { lines: ["എന്തിന് make ചെയ്യുന്നു.", "എന്ത് fail ആയി.", "*ഇനി എന്ത്.*"] },
      { lines: ["Maker Stories", "*ഉടൻ എത്തും.*"], cta: true },
    ],
    caption: "ഓരോ project-ന്റെ പിന്നിലും ഒരു മനുഷ്യനുണ്ട്: എന്തിന് make ചെയ്യുന്നു, എന്ത് fail ആയി, ഇനി എന്ത്. ആ കഥകൾ പറയാൻ Maker Stories ഉടൻ എത്തും.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "09-curiosity-is-enough": {
    slides: [
      { lines: ["ഇതുവരെ ഒന്നും", "*make ചെയ്തിട്ടില്ലേ?*"] },
      { lines: ["എന്നാലും വരൂ.", "Curiosity മാത്രം", "*മതി.*"], cta: true },
    ],
    caption: "ഇതുവരെ ഒന്നും make ചെയ്തിട്ടില്ലേ? എന്നാലും വരൂ. Curiosity മാത്രം മതി. ✨\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "10-sharing-over-winning": {
    slides: [
      { lines: ["നിങ്ങളുടെ project", "വേറൊരാളുടേതിനെ", "*beat ചെയ്യണോ?*"] },
      { lines: ["Point ഇതാണ്:", "കണ്ടെത്തിയത്", "*share ചെയ്യുക.*"] },
      { lines: ["എന്ത് work ആയി.", "എന്ത് മാറി.", "*എന്ത് പഠിച്ചു.*"] },
      { lines: ["ഒരാൾക്ക്", "കൊണ്ടുപോകാൻ", "*ഒരു idea.*"], cta: true },
    ],
    caption: "Show ചെയ്യുക, share ചെയ്യുക, പഠിക്കുക: അതാണ് പ്രധാന invitation. ചില Faire-കളിൽ contests-ഓ awards-ഓ ഉണ്ടാകാം, പക്ഷേ competition അല്ല ഈ experience-ന്റെ core. പണി തീരാത്ത ഒരു project-ഉം അത് പഠിപ്പിച്ച കാര്യങ്ങളും മതി നല്ലൊരു conversation തുടങ്ങാൻ.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "11-the-maker-movement": {
    slides: [
      { lines: ["Faire തീരും.", "പക്ഷേ making", "*തുടരും.*"] },
      { lines: ["Bedroom-ൽ.", "Workshop-ൽ.", "*Shared spaces-ൽ.*"] },
      { lines: ["Idea try ചെയ്യൂ.", "Know-how share ചെയ്യൂ.", "*ഒരാളെ help ചെയ്യൂ.*"] },
      { lines: ["അതാണ്", "*Maker Movement*", "daily life-ൽ."], cta: true },
    ],
    caption: "Learning by doing, experiments, knowledge sharing: ഇതിന്റെയെല്ലാം വലിയൊരു culture ആണ് Maker Movement. ആ culture കണ്ണിൽ കാണാവുന്ന ഒരിടമാണ് Faire. എല്ലാവരും വീട്ടിൽ പോയിക്കഴിഞ്ഞും next experiment നടക്കും.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "12-where-it-started": {
    slides: [
      { lines: ["ആദ്യം makers", "ഉണ്ടായിരുന്നത്", "*ഒരു magazine-ൽ.*"] },
      { lines: ["Make: അവരുടെ", "projects", "*page-ൽ എത്തിച്ചു.*"] },
      { stat: "2006", label: "First Faire / Bay Area" },
      { lines: ["Pages-ന് പിന്നിലെ", "ആളുകൾ", "*ഒത്തുകൂടി.*"], cta: true },
    ],
    caption: "Make: magazine തുടങ്ങിയത് 2005-ൽ. 2006-ൽ San Francisco Bay Area-യിൽ ആദ്യ Maker Faire നടന്നു. ആ culture-ന് പിന്നിലെ ആളുകളെയും projects-നെയും അത് ഒരേ space-ൽ ഒന്നിച്ചുകൂട്ടി. ആ ഒരു gathering വലിയൊരു story-യുടെ തുടക്കമായി.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "13-the-global-scale": {
    slides: [
      { lines: ["ഒരു idea-ക്ക്", "എത്ര ദൂരം", "*travel ചെയ്യാം?*"] },
      { stat: "232", label: "Maker Faires / 2025" },
      { stat: "27", label: "Countries / 2025" },
      { stat: "5", label: "Continents / 2025" },
      { lines: ["Share ചെയ്യാൻ ഒന്നുള്ള", "ആളുകളുടെ", "*ഒരു world.*"], cta: true },
    ],
    caption: "Maker Faire Yearbook-ന്റെ 2025 snapshot അനുസരിച്ച് 5 continents-ലായി 27 countries-ൽ 232 Maker Faires. Idea മനസ്സിലായിക്കഴിഞ്ഞാൽ ഈ scale-ന് ഒരു meaning ഉണ്ട്: ലോകമെമ്പാടും make ചെയ്യുകയും share ചെയ്യുകയും ചെയ്യുന്ന ആളുകൾ.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "14-global-has-place-names": {
    slides: [
      { lines: ["“Global”-ന്", "*place names ഉണ്ട്.*"] },
      { lines: ["Bay Area.", "Rome.", "*Hannover.*"] },
      { lines: ["Shenzhen.", "*Taipei.*"] },
      { lines: ["പിന്നെ Maker Faire", "map-ൽ:", "*നമ്മുടെ Kochi.*"], cta: true },
    ],
    caption: "Bay Area, Rome, Hannover, Shenzhen, Taipei… പിന്നെ നമ്മുടെ Kochi. ഓരോ പേരും ആളുകൾ making-നായി ഒത്തുകൂടുന്ന ഒരിടമാണ്. Official Maker Faire listings-ൽ Kochi-യുമുണ്ട്. സ്വന്തം ആളുകളും projects-ഉമുള്ള local gatherings-ന്റെ ഒരു network.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "15-one-network-many-scales": {
    slides: [
      { lines: ["എല്ലാ Faire-ഉം", "ഒരേ size", "*ആകണോ?*"] },
      { lines: ["Global Faires:", "വലിയ festivals.", "*ദൂരെനിന്നും ആളുകൾ.*"] },
      { lines: ["Community Faires:", "Local organisers.", "*Local makers.*"] },
      { lines: ["ഒരു network.", "പല sizes.", "*എല്ലാത്തിനും ഇടം.*"], cta: true },
    ],
    caption: "Global, Featured, Community, School എന്നിങ്ങനെ പല തരം Faires ഉണ്ട്. വലിയ international festivals-ഉം ചെറിയ local gatherings-ഉം ഒരേ network-ന്റെ ഭാഗമാണ്. Licensed organisers സ്വന്തം community-ക്ക് ചേർന്ന രീതിയിൽ event ഒരുക്കുന്നു.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "16-what-travels": {
    slides: [
      { lines: ["City വേറെ.", "Projects വേറെ.", "*മാറാത്തത് എന്ത്?*"] },
      { lines: ["ആ question:", "*“ഇതെങ്ങനെ*", "*build ചെയ്തു?”*"] },
      { lines: ["ആ invitation:", "*“വാ, കാണിച്ചുതരാം.”*"] },
      { lines: ["Curiosity.", "Sharing.", "*ഒരുമിച്ചുള്ള making.*"], cta: true },
    ],
    caption: "Materials-ഉം languages-ഉം projects-ഉം മാറാം. പക്ഷേ curiosity-യും experiments-ഉം എന്തെങ്കിലും മറ്റൊരാൾക്ക് pass on ചെയ്യാനുള്ള മനസ്സും മാറില്ല. അതാണ് ഓരോ Faire-നെയും connect ചെയ്യുന്ന thread.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "17-what-kerala-makes-of-it": {
    slides: [
      { lines: ["ഓരോ Faire-ഉം", "അതിലെ ആളുകളുടെ", "*shape എടുക്കും.*"] },
      { lines: ["അവരുടെ materials.", "അവരുടെ questions.", "*അവരുടെ രീതികൾ.*"] },
      { lines: ["അപ്പോൾ കേരളം", "make ചെയ്യുമ്പോൾ", "*എന്താകും?*"] },
      { lines: ["നമ്മുടെ ആളുകൾ.", "നമ്മുടെ projects.", "*നമ്മുടെ*", "*Maker Faire.*"], cta: true },
    ],
    caption: "ഒരു shared network-ൽ പല local identities-നും ഇടമുണ്ട്. കേരളം അതിലേക്ക് കൊണ്ടുവരുന്നത് നമ്മുടെ സ്വന്തം skills-ഉം materials-ഉം പണിരീതികളുമാണ്. ഒരു Faire-നെ തനി നമ്മുടേതാക്കുന്നത് എന്തായിരിക്കും?\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "18-kochi-in-the-network": {
    slides: [
      { lines: ["Kochi ഇപ്പോൾ", "Maker Faire", "*map-ൽ ഉണ്ട്.*"] },
      { lines: ["നമ്മുടെ makers.", "ഒരു global network-ൽ", "*ഒരിടം.*"] },
      { lines: ["നമ്മൾ build ചെയ്യുന്നത്", "Circle-ന് പുറത്തും", "*share ചെയ്യാൻ*", "*ഒരു chance.*"] },
      { lines: ["കേരളത്തിന്റെ stories.", "ഒരു വലിയ", "*conversation.*"], cta: true },
    ],
    caption: "Maker Faire-ന്റെ official calendar-ൽ Kochi ഉണ്ട്. കേരളത്തിലെ maker culture-ന് ഒരു international network-ൽ സ്വയം introduce ചെയ്യാൻ ഒരിടം. നമ്മുടെ stories, make ചെയ്യുന്നവർ തന്നെ പറയുന്നു.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "19-what-connections-can-do": {
    slides: [
      { lines: ["ഒറ്റയ്ക്ക് build", "ചെയ്യുമ്പോൾ ലോകം", "*ചെറുതായി തോന്നാം.*"] },
      { lines: ["അപ്പോഴാണ്", "ഒരാൾ ഒരു", "*new question*", "*ചോദിക്കുന്നത്.*"] },
      { lines: ["Ideas swap ചെയ്യൂ.", "Notes compare ചെയ്യൂ.", "*വേറൊരു maker-നെ*", "*കാണൂ.*"] },
      { lines: ["ഒരു connection", "തുടങ്ങുന്നത്", "*നിങ്ങളുടെ*", "*project-ൽ നിന്നാകാം.*"], cta: true },
    ],
    caption: "നിങ്ങളുടെ project എങ്ങനെ work ചെയ്യുന്നു എന്ന് show ചെയ്യൂ, മറ്റുള്ളവർ എന്ത് notice ചെയ്യുന്നു എന്ന് കേൾക്കൂ, വേറൊരു maker-ന്റെ approach-ഉമായി compare ചെയ്യൂ. നല്ല conversations-നും collaborations-നും ഒരു Faire chance ഒരുക്കുന്നു. ആരുമായാണ് notes compare ചെയ്യാൻ നിങ്ങൾക്ക് ഇഷ്ടം?\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
};
