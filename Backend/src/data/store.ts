import { generateId } from "../utils/id.js";

import { loadSiteSettings } from "./siteSettingsStore.js";

const now = new Date();
const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const subDays = (date, days) => addDays(date, -days);

const departments = [
  {
    id: "idara-vijana",
    name: "Idara ya Vijana",
    description:
      "Idara inayolenga kukuza vipaji, uongozi, maisha ya maombi, na huduma ya vijana ndani na nje ya kanisa.",
    imageUrl:
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80",
    createdAt: subDays(now, 120).toISOString(),
    committee: [
      {
        id: generateId("cm"),
        name: "Pr. Emmanuel Mollel",
        title: "Mwenyekiti",
        description: "Msimamizi wa mipango ya vijana."
      },
      {
        id: generateId("cm"),
        name: "Bw. Kelvin Nyoni",
        title: "Katibu",
        description: "Mratibu wa ratiba na taarifa."
      }
    ]
  },
  {
    id: "idara-uinjilisti",
    name: "Idara ya Uinjilisti",
    description: "Kurahisisha kuhubiri injili, mikutano ya hadhara, na outreach.",
    imageUrl:
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
    createdAt: subDays(now, 180).toISOString(),
    committee: [
      {
        id: generateId("cm"),
        name: "Mzee Lucas Mtema",
        title: "Mwenyekiti",
        description: "Anasimamia mikakati ya uinjilisti."
      }
    ]
  }
];

const reports = [
  {
    id: generateId("rep"),
    departmentId: "idara-uinjilisti",
    title: "Ripoti ya Uinjilisti wa Robo ya Kwanza",
    content: "Watu 46 walibatizwa na semina 4 za jamii zilifanyika.",
    reportDate: subDays(now, 8).toISOString(),
    author: "Mzee Lucas Mtema",
    attachments: []
  },
  {
    id: generateId("rep"),
    departmentId: "idara-vijana",
    title: "Ripoti ya Kambi ya Vijana",
    content: "Vijana 120 walihudhuria mafunzo ya leadership na mission outreach.",
    reportDate: subDays(now, 16).toISOString(),
    author: "Pr. Emmanuel Mollel",
    attachments: []
  }
];

const leaders = [
  {
    id: generateId("ldr"),
    name: "Pr. Joseph Mwang'onda",
    title: "Mchungaji Kiongozi",
    biography: "Anasimamia huduma za kiroho, mafundisho, na maono ya kanisa.",
    imageUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80",
    order: 1
  },
  {
    id: generateId("ldr"),
    name: "Mzee Annaeli Mrema",
    title: "Mzee wa Kanisa",
    biography: "Mratibu wa malezi ya kiroho na ushauri wa ndoa/familia.",
    imageUrl:
      "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?auto=format&fit=crop&w=900&q=80",
    order: 2
  }
];

const groups = [
  {
    id: generateId("grp"),
    name: "Kwaya ya Makulu Praise",
    description: "Huduma ya nyimbo za ibada na matamasha ya injili.",
    imageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    youtubeLink: "https://www.youtube.com/watch?v=9No-FiEInLA"
  },
  {
    id: generateId("grp"),
    name: "Pathfinders Makulu",
    description: "Kikundi cha vijana kwa mafunzo ya nidhamu, leadership, na mission.",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    youtubeLink: "https://www.youtube.com/watch?v=8Y0fM4FJQvQ"
  }
];

const announcements = [
  {
    id: generateId("ann"),
    title: "Wiki ya Maombi ya Familia",
    content: "Vipindi vya jioni kila siku kuanzia saa 12:00 hadi 2:00 usiku.",
    startDate: subDays(now, 2).toISOString(),
    endDate: addDays(now, 2).toISOString(),
    status: "scheduled"
  },
  {
    id: generateId("ann"),
    title: "Sabato ya Wageni",
    content: "Karibisha marafiki na ndugu kwa ibada maalum ya shukrani.",
    startDate: addDays(now, 8).toISOString(),
    endDate: addDays(now, 8).toISOString(),
    status: "scheduled"
  }
];

const defaultSiteSettings = {
    churchName: "DODOMA MAKULU SDA CHURCH",
    logoUrl: "",
    themeColor: "#2543e2",
    heroCarousel: [
      {
        id: "slide-1",
        imageUrl:
          "https://images.unsplash.com/photo-1468421870903-4df1664ac249?auto=format&fit=crop&w=1800&q=85",
        badge: "",
        title: "DODOMA MAKULU SDA CHURCH",
        scripture: '"Nami nikawafurahia waliponiambia, Twende nyumbani kwa Bwana." Zaburi 122:1',
        description:
          "Karibu kwenye jukwaa rasmi la kanisa kwa ibada, matangazo, idara, viongozi, na huduma za kiroho.",
        primaryLabel: "Angalia Matangazo",
        primaryHref: "/#matangazo",
        secondaryLabel: "Wasiliana Nasi",
        secondaryHref: "/#mawasiliano",
        brightness: "dark"
      },
      {
        id: "slide-2",
        imageUrl:
          "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1800&q=85",
        badge: "Huduma ya Jamii",
        title: "Huduma, Umoja, na Upendo",
        scripture: '"Hivyo basi, wakati tunapopata nafasi, na tuwatendee watu wote mema." Wagalatia 6:10',
        description:
          "Tunajenga jamii yenye matumaini kupitia maombi, uinjilisti, na huduma za upendo kwa kila familia.",
        primaryLabel: "Tazama Idara",
        primaryHref: "/idara",
        secondaryLabel: "Kwaya & Vikundi",
        secondaryHref: "/vikundi",
        brightness: "light"
      },
      {
        id: "slide-3",
        imageUrl:
          "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1800&q=85",
        badge: "Ibada na Neno",
        title: "Imarisha Imani Yako Kila Siku",
        scripture: '"Neno lako ni taa ya miguu yangu, na mwanga wa njia yangu." Zaburi 119:105',
        description:
          "Pata ratiba za ibada, mahubiri mapya, na taarifa muhimu za kanisa moja kwa moja kupitia mfumo huu.",
        primaryLabel: "Soma Ripoti",
        primaryHref: "/#reports",
        secondaryLabel: "Ingia Admin",
        secondaryHref: "/admin/login",
        brightness: "dark"
      }
    ],
    missionSection: {
      sectionTitle: "UTUME WETU",
      statementTitle:
        "We are a church rooted in the community, dedicated to fulfilling the Great Commission from Matthew 28:19-20.",
      statementQuote:
        '"Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you."',
      scriptureCards: [
        {
          id: "mission-card-1",
          reference: "Ufunuo 14:6-7",
          content:
            'Ujumbe wa malaika wa kwanza. "Kisha nikamwona malaika mwingine, akiruka katikati ya mbingu, mwenye injili ya milele..."'
        },
        {
          id: "mission-card-2",
          reference: "Ufunuo 14:8",
          content: "Ujumbe wa malaika wa pili. Ujumbe wa mwaliko wa kutoka Babeli."
        },
        {
          id: "mission-card-3",
          reference: "Ufunuo 14:9-11",
          content: "Ujumbe wa malaika wa tatu. Wito wa ibada ya kweli na uaminifu kwa Mungu."
        }
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=1200&q=85",
      imageAlt: "Mission illustration"
    },
    contactInfo: {
      phone: "+255 7xx xxx xxx",
      email: "info@makulusda.org",
      address: "Makulu, Dodoma, Tanzania"
    },
    socialLinks: {
      facebook: "https://facebook.com",
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      whatsapp: "https://wa.me/255700000000"
    },
    quickLinks: [
      { id: "quick-home", label: "Home", href: "/" },
      { id: "quick-idara", label: "Idara", href: "/idara" },
      { id: "quick-viongozi", label: "Viongozi", href: "/viongozi" },
      { id: "quick-vikundi", label: "Vikundi", href: "/vikundi" },
      { id: "quick-matangazo", label: "Matangazo", href: "/matangazo" },
      { id: "quick-mawasiliano", label: "Mawasiliano", href: "/#mawasiliano" }
    ],
    seo: {
      title: "DODOMA MAKULU SDA CHURCH",
      description: "Tovuti rasmi ya DODOMA MAKULU SDA CHURCH.",
      keywords: "SDA, Dodoma, Makulu, Church"
    },
    faviconUrl: "",
    footerText: `(c) ${now.getFullYear()} DODOMA MAKULU SDA CHURCH.`
  };

export const db = {
  siteSettings: loadSiteSettings(defaultSiteSettings),
  departments,
  leaders,
  groups,
  reports,
  announcements,
  activities: []
};

