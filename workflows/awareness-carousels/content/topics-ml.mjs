// Malayalam edition: spoken Malayalam in Malayalam script, with English wherever people actually say it in English
// (maker, project, build, workshop, idea, network…). Rewritten 2026-11-02 in the register of the Kurian videos
// (workflows/live-action): conversational forms (വാ, ചെയ്യ്, കാണിക്ക്, ആളുണ്ട്, നന്നാക്കിയോ) rather than a
// translation of the English slide.
// Same keys and markup as topics.mjs (*accent*, ~strike~); asm/label/chapter/sources come from the English file.
// A Malayalam suffix after an English word starts with a full letter ("project-ൽ", "Repair shop-ൽ"), never a bare
// vowel sign. Keep Malayalam lines to about 18 characters.
// Rendered with: node src/build.mjs --look=… --lang=ml, or the Studio track (node src/studio.mjs --lang=ml).
export const TOPICS_ML = {
  "01-maker-faire-101": {
    slides: [
      { lines: ["Maker Faire", "*എന്താ സംഭവം?*"] },
      { lines: ["ഇതൊരു", "~conference~ അല്ല."] },
      { lines: ["സ്വന്തമായി", "എന്തെങ്കിലും", "ഉണ്ടാക്കുന്നവരുടെ", "*show-and-tell.*"] },
      { lines: ["വെറുതെ നോക്കി", "നിൽക്കണ്ട.", "*Try ചെയ്ത് നോക്ക്.*"], cta: true },
    ],
    caption: "ഇതൊരു conference അല്ല. സ്വന്തമായി എന്തെങ്കിലും ഉണ്ടാക്കുന്നവരുടെ ഒരു വലിയ show-and-tell ആണ്. ഇവിടെ വെറുതെ നോക്കി നിൽക്കണ്ട, നിങ്ങളും try ചെയ്ത് നോക്ക്.\nMaker Faire Kochi ഉടൻ വരുന്നു. 🛠️",
  },
  "02-kerala-already-makes": {
    slides: [
      { lines: ["“Maker” എന്ന", "വാക്ക് വരും", "*മുമ്പേ…*"] },
      { lines: ["…കേരളം", "പണ്ടേ", "*പണി തുടങ്ങിയതാ.*"] },
      { lines: ["Repair shop-ൽ.", "അടുക്കളയിൽ.", "Campus-ൽ.", "*Workshop-ൽ.*"] },
      { lines: ["ഇനി അതിന്", "*ഒരു stage.*"], cta: true },
    ],
    caption: "“Maker” എന്ന വാക്ക് വരും മുമ്പേ കേരളം പണി തുടങ്ങിയതാ: repair shop-ലും അടുക്കളയിലും campus-ലും workshop-ലും. ഇനി അതിന് ഒരു stage.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "03-not-just-tech": {
    slides: [
      { lines: ["Making =", "~coding?~"] },
      { lines: ["Woodwork. പാചകം.", "Repair. പാട്ട്.", "Fashion. *Art.*"] },
      { lines: ["പിന്നെ coding-ഉം", "*ഉണ്ട് കേട്ടോ.*"], cta: true },
    ],
    caption: "Making എന്ന് പറഞ്ഞാൽ coding മാത്രമാണോ? അല്ല. Woodwork, പാചകം, repair, പാട്ട്, fashion, art… പിന്നെ coding-ഉം ഉണ്ട് കേട്ടോ.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "04-who-counts-as-a-maker": {
    slides: [
      { lines: ["ആരാ ഈ", "*maker?*"] },
      { lines: ["Degree വേണ്ട.", "Lab വേണ്ട.", "*Permission-ഉം വേണ്ട.*"] },
      { lines: ["എന്തെങ്കിലും", "ഉണ്ടാക്കുന്നുണ്ടോ?", "*നിങ്ങളും*", "*maker ആണ്.*"], cta: true },
    ],
    caption: "Degree വേണ്ട. Lab വേണ്ട. ആരുടെയും permission-ഉം വേണ്ട. എന്തെങ്കിലും ഉണ്ടാക്കുന്നുണ്ടെങ്കിൽ നിങ്ങളും ഒരു maker ആണ്.\nMaker Faire Kochi ഉടൻ വരുന്നു. 🔧",
  },
  "05-repair-is-making": {
    slides: [
      { lines: ["Fan നന്നാക്കിയോ?", "Bag തുന്നിയോ?", "Lamp *rewire ചെയ്തോ?*"] },
      { lines: ["അതും", "*making തന്നെയാ.*"], cta: true },
    ],
    caption: "Fan നന്നാക്കിയോ? Bag തുന്നിയോ? Lamp rewire ചെയ്തോ? അതും making തന്നെയാ. 🪛\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "06-version-one": {
    slides: [
      { lines: ["ഏത് maker-നും", "work ആകാത്ത ഒരു", "*version കാണും.*"] },
      { lines: ["തെറ്റിയ circuit.", "പൊട്ടിയ print.", "*കരിഞ്ഞുപോയ*", "*first batch.*"] },
      { lines: ["അത്", "~failure~ അല്ല,", "*version 1 ആണ്.*"] },
      { lines: ["എന്ത് മാറി എന്ന്", "*വന്ന് കാണിക്ക്.*"], cta: true },
    ],
    caption: "ഏത് maker-നും work ആകാത്ത ഒരു version കാണും: തെറ്റിയ circuit, പൊട്ടിയ print, കരിഞ്ഞുപോയ first batch. അത് failure അല്ല, version 1 ആണ്.\nഎന്ത് മാറി എന്ന് വന്ന് കാണിക്ക്. Maker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "07-kuttimakers": {
    slides: [
      { lines: ["എന്തെങ്കിലും", "ഉണ്ടാക്കാൻ", "*എത്ര വയസ്സ് വേണം?*"] },
      { lines: ["School projects.", "ആദ്യ experiments.", "*ഒരുപാട് curiosity.*"] },
      { lines: ["Build ചെയ്യാൻ", "age ഒരു", "*പ്രശ്നമേ അല്ല.*"], cta: true },
    ],
    caption: "എന്തെങ്കിലും ഉണ്ടാക്കാൻ എത്ര വയസ്സ് വേണം? School projects, ആദ്യ experiments, ഒരുപാട് curiosity. Build ചെയ്യാൻ age ഒരു പ്രശ്നമേ അല്ല. 🧒\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  // Maker Stories (video series) is not out yet, so the sign-off says it is coming rather than "meet them in".
  "08-maker-stories": {
    slides: [
      { lines: ["ഓരോ project-ന്റെ", "പിന്നിലും ഒരു", "*ആളുണ്ട്.*"] },
      { lines: ["എന്തിനാ ചെയ്യുന്നേ?", "എന്താ fail ആയേ?", "*ഇനി അടുത്തത്?*"] },
      { lines: ["Maker Stories", "*ഉടൻ വരുന്നു.*"], cta: true },
    ],
    caption: "ഓരോ project-ന്റെ പിന്നിലും ഒരു ആളുണ്ട്. എന്തിനാ ചെയ്യുന്നേ, എന്താ fail ആയേ, ഇനി അടുത്തത് എന്ത്: ആ കഥകളുമായി Maker Stories ഉടൻ വരുന്നു.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "09-curiosity-is-enough": {
    slides: [
      { lines: ["ഇതുവരെ ഒന്നും", "*ഉണ്ടാക്കിയിട്ടില്ലേ?*"] },
      { lines: ["സാരമില്ല, വാ.", "Curiosity മാത്രം", "*മതി.*"], cta: true },
    ],
    caption: "ഇതുവരെ ഒന്നും ഉണ്ടാക്കിയിട്ടില്ലേ? സാരമില്ല, വാ. Curiosity മാത്രം മതി. ✨\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "10-sharing-over-winning": {
    slides: [
      { lines: ["നിങ്ങളുടെ project", "വേറൊരാളുടേതിനെ", "*തോൽപ്പിക്കണോ?*"] },
      { lines: ["അതല്ല കാര്യം.", "കണ്ടുപിടിച്ചത്", "*share ചെയ്യുക.*"] },
      { lines: ["എന്താ work ആയേ.", "എന്താ മാറിയേ.", "*എന്താ പഠിച്ചേ.*"] },
      { lines: ["ആർക്കെങ്കിലും", "കൊണ്ടുപോകാൻ", "*ഒരു idea കൊടുക്ക്.*"], cta: true },
    ],
    caption: "ഇവിടെ main ആയി show ചെയ്യലും share ചെയ്യലും പഠിക്കലുമാണ്. ചില Faire-കളിൽ contests-ഓ awards-ഓ കാണും, പക്ഷേ competition അല്ല ഇതിന്റെ core. പണി തീരാത്ത ഒരു project-ഉം അത് പഠിപ്പിച്ച കാര്യങ്ങളും മതി, നല്ലൊരു conversation തുടങ്ങാൻ.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "11-the-maker-movement": {
    slides: [
      { lines: ["Faire തീരും.", "പക്ഷേ making", "*നിൽക്കില്ല.*"] },
      { lines: ["Bedroom-ൽ.", "Workshop-ൽ.", "*Shared spaces-ൽ.*"] },
      { lines: ["Idea try ചെയ്യ്.", "അറിവ് share ചെയ്യ്.", "*ഒരാളെ സഹായിക്ക്.*"] },
      { lines: ["അതാണ്", "*Maker Movement,*", "daily life-ൽ."], cta: true },
    ],
    caption: "പഠിച്ചും പരീക്ഷിച്ചും അറിയുന്നത് share ചെയ്തും മുന്നോട്ട് പോകുന്ന ഒരു culture ആണ് Maker Movement. അത് കണ്ണിൽ കാണാൻ പറ്റുന്ന ഒരിടമാണ് Faire. എല്ലാവരും വീട്ടിൽ പോയിക്കഴിഞ്ഞാലും അടുത്ത experiment നടക്കും.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "12-where-it-started": {
    slides: [
      { lines: ["എല്ലാം തുടങ്ങിയത്", "*ഒരു magazine-ൽ.*"] },
      { lines: ["Make: magazine", "അവരുടെ projects", "*page-ൽ എത്തിച്ചു.*"] },
      { stat: "2006", label: "First Faire / Bay Area" },
      { lines: ["Page-ലെ ആളുകൾ", "നേരിട്ട്", "*ഒത്തുകൂടി.*"], cta: true },
    ],
    caption: "Make: magazine തുടങ്ങിയത് 2005-ൽ. 2006-ൽ San Francisco Bay Area-യിൽ ആദ്യത്തെ Maker Faire നടന്നു: magazine-ലെ ആളുകളും projects-ഉം ഒരേ സ്ഥലത്ത് ഒത്തുകൂടി. ആ ഒരു gathering ആണ് വലിയൊരു കഥയുടെ തുടക്കം.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "13-the-global-scale": {
    slides: [
      { lines: ["ഒരു idea", "എത്ര ദൂരം", "*പോകും?*"] },
      { stat: "232", label: "Maker Faires / 2025" },
      { stat: "27", label: "Countries / 2025" },
      { stat: "5", label: "Continents / 2025" },
      { lines: ["Share ചെയ്യാൻ", "എന്തെങ്കിലും ഉള്ള", "*ആളുകളുടെ ലോകം.*"], cta: true },
    ],
    caption: "Maker Faire Yearbook-ന്റെ 2025 കണക്ക് പ്രകാരം 5 continents-ലായി 27 countries-ൽ 232 Maker Faires. ലോകം മുഴുവൻ make ചെയ്യുകയും share ചെയ്യുകയും ചെയ്യുന്ന ആളുകൾ.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "14-global-has-place-names": {
    slides: [
      { lines: ["“Global” എന്നാൽ", "*കുറെ സ്ഥലങ്ങളാ.*"] },
      { lines: ["Bay Area.", "Rome.", "*Hannover.*"] },
      { lines: ["Shenzhen.", "*Taipei.*"] },
      { lines: ["പിന്നെ Maker Faire", "map-ൽ:", "*നമ്മുടെ Kochi.*"], cta: true },
    ],
    caption: "Bay Area, Rome, Hannover, Shenzhen, Taipei… പിന്നെ നമ്മുടെ Kochi. ഓരോ പേരും making-നായി ആളുകൾ ഒത്തുകൂടുന്ന ഒരിടമാണ്. Official Maker Faire listings-ൽ Kochi-യും ഉണ്ട്. സ്വന്തം ആളുകളും projects-ഉമുള്ള local gatherings-ന്റെ ഒരു network.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "15-one-network-many-scales": {
    slides: [
      { lines: ["എല്ലാ Faire-ഉം", "ഒരേ size", "*ആകണോ?*"] },
      { lines: ["Global Faires:", "വലിയ festivals.", "*ദൂരെ നിന്ന് ആളുകൾ.*"] },
      { lines: ["Community Faires:", "നാട്ടിലെ organisers.", "*നാട്ടിലെ makers.*"] },
      { lines: ["ഒരു network.", "പല sizes.", "*എല്ലാത്തിനും ഇടം.*"], cta: true },
    ],
    caption: "Global, Featured, Community, School: പല തരം Faires ഉണ്ട്. വലിയ international festivals-ഉം ചെറിയ local gatherings-ഉം ഒരേ network-ന്റെ ഭാഗമാണ്. ഓരോ നാട്ടിലെയും licensed organisers അവരുടെ community-ക്ക് ചേരുന്ന പോലെ event ഒരുക്കുന്നു.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "16-what-travels": {
    slides: [
      { lines: ["City വേറെ.", "Projects വേറെ.", "*മാറാത്തത് എന്താ?*"] },
      { lines: ["ആ ചോദ്യം:", "*“ഇതെങ്ങനെ*", "*ഉണ്ടാക്കി?”*"] },
      { lines: ["ആ invitation:", "*“വാ, കാണിച്ചുതരാം.”*"] },
      { lines: ["Curiosity.", "Sharing.", "*ഒരുമിച്ചുള്ള making.*"], cta: true },
    ],
    caption: "Materials-ഉം ഭാഷയും projects-ഉം മാറും. പക്ഷേ curiosity-യും experiments-ഉം, അറിയുന്നത് വേറൊരാൾക്ക് പകർന്നുകൊടുക്കാനുള്ള മനസ്സും മാറില്ല. അതാണ് ഓരോ Faire-നെയും connect ചെയ്യുന്ന thread.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "17-what-kerala-makes-of-it": {
    slides: [
      { lines: ["ഓരോ Faire-ഉം", "അവിടത്തെ ആളുകളെ", "*പോലെയാകും.*"] },
      { lines: ["അവരുടെ materials.", "അവരുടെ ചോദ്യങ്ങൾ.", "*അവരുടെ രീതികൾ.*"] },
      { lines: ["അപ്പോൾ കേരളം", "ഇത് ചെയ്താൽ", "*എങ്ങനെയിരിക്കും?*"] },
      { lines: ["നമ്മുടെ ആളുകൾ.", "നമ്മുടെ projects.", "*നമ്മുടെ*", "*Maker Faire.*"], cta: true },
    ],
    caption: "ഒരു network-ൽ പല local identities-നും ഇടമുണ്ട്. നമ്മുടെ skills-ഉം materials-ഉം പണിരീതികളുമാണ് കേരളം അതിലേക്ക് കൊണ്ടുവരുന്നത്. ഒരു Faire-നെ തനി നമ്മുടേതാക്കുന്നത് എന്തായിരിക്കും?\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "18-kochi-in-the-network": {
    slides: [
      { lines: ["Kochi ഇപ്പോൾ", "Maker Faire", "*map-ൽ ഉണ്ട്.*"] },
      { lines: ["നമ്മുടെ makers-ന്", "ഒരു global network-ൽ", "*ഒരിടം.*"] },
      { lines: ["നമ്മുടെ പണികൾ", "circle-ന് പുറത്ത്", "*കാണിക്കാൻ*", "*ഒരു chance.*"] },
      { lines: ["കേരളത്തിന്റെ കഥകൾ,", "ഒരു വലിയ", "*conversation-ൽ.*"], cta: true },
    ],
    caption: "Maker Faire-ന്റെ official calendar-ൽ Kochi ഉണ്ട്. കേരളത്തിലെ maker culture-ന് ഒരു international network-ൽ സ്വയം പരിചയപ്പെടുത്താൻ ഒരിടം. നമ്മുടെ കഥകൾ, ഉണ്ടാക്കുന്നവർ തന്നെ പറയുന്നു.\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
  "19-what-connections-can-do": {
    slides: [
      { lines: ["ഒറ്റയ്ക്ക് build", "ചെയ്യുമ്പോൾ ലോകം", "*ചെറുതായി തോന്നും.*"] },
      { lines: ["അപ്പോഴാ ഒരാൾ", "നമ്മൾ ഓർക്കാത്ത", "*ഒരു question*", "*ചോദിക്കുന്നത്.*"] },
      { lines: ["Ideas swap ചെയ്യ്.", "Notes compare ചെയ്യ്.", "*വേറൊരു maker-നെ*", "*പരിചയപ്പെട്.*"] },
      { lines: ["ഒരു connection", "തുടങ്ങുന്നത്", "*നിങ്ങളുടെ project-ൽ*", "*നിന്നാകാം.*"], cta: true },
    ],
    caption: "നിങ്ങളുടെ project എങ്ങനെ work ചെയ്യുന്നു എന്ന് കാണിക്ക്, മറ്റുള്ളവർ എന്ത് notice ചെയ്യുന്നു എന്ന് കേൾക്ക്, വേറൊരു maker-ന്റെ approach-ഉമായി compare ചെയ്യ്. നല്ല conversations-നും collaborations-നും Faire ഒരു chance ആണ്. ആരുമായിട്ടാ notes compare ചെയ്യാൻ ഇഷ്ടം?\nMaker Faire Kochi ഉടൻ വരുന്നു.",
  },
};
