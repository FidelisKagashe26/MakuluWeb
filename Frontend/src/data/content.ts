import { addDays, setHours, setMinutes, subDays } from "date-fns";

const toIsoAt = (date: Date, hours: number, minutes = 0) =>
  setMinutes(setHours(date, hours), minutes).toISOString();

const now = new Date();

export type Announcement = {
  id: string;
  title: string;
  content: string;
  location: string;
  startDate: string;
  endDate: string;
};

export type DepartmentCommitteeMember = {
  id: string;
  name: string;
  title: string;
  bio: string;
};

export type DepartmentReport = {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
};

export type Department = {
  id: string;
  name: string;
  image: string;
  description: string;
  category: "Uinjilisti" | "Malezi" | "Huduma" | "Ushirika";
  committee: DepartmentCommitteeMember[];
  reports: DepartmentReport[];
};

export type Leader = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type Group = {
  id: string;
  name: string;
  type: string;
  description: string;
  youtubeChannelLink: string;
  youtubeVideoLink: string;
  image: string;
};

export const churchInfo = {
  name: "DODOMA MAKULU SDA CHURCH",
  subtitle: "Adventist Website",
  scripture: '"Nami nikawafurahia waliponiambia, Twende nyumbani kwa Bwana." Zaburi 122:1',
  description:
    "Tovuti rasmi ya DODOMA MAKULU SDA CHURCH kwa matangazo, idara, viongozi, vikundi, na taarifa za kiroho."
};

export const announcements: Announcement[] = [
  {
    id: "announce-1",
    title: "Wiki ya Maombi ya Familia",
    content:
      "Vipindi vya jioni kila siku kuanzia saa 12:00 hadi 2:00 usiku, pamoja na maombi maalum kwa familia.",
    location: "Ukumbi Mkuu wa Kanisa",
    startDate: toIsoAt(addDays(now, -2), 18),
    endDate: toIsoAt(addDays(now, 2), 20)
  },
  {
    id: "announce-2",
    title: "Semina ya Vijana na Afya",
    content:
      "Mafunzo ya afya ya akili, ajira, leadership, na mission outreach kwa vijana wa kanisa.",
    location: "Jengo la Vijana",
    startDate: toIsoAt(addDays(now, 5), 9),
    endDate: toIsoAt(addDays(now, 5), 16)
  },
  {
    id: "announce-3",
    title: "Sabato ya Wageni",
    content:
      "Karibisha marafiki na ndugu kwa ibada maalum ya shukrani, ushuhuda, na mlo wa pamoja.",
    location: "Kanisa Kuu - Makulu",
    startDate: toIsoAt(addDays(now, 12), 8),
    endDate: toIsoAt(addDays(now, 12), 13)
  }
];

export const departments: Department[] = [
  {
    id: "idara-vijana",
    name: "Idara ya Vijana",
    category: "Malezi",
    description:
      "Idara inayolenga kukuza vipaji, uongozi, maisha ya maombi, na huduma ya vijana ndani na nje ya kanisa.",
    image:
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80",
    committee: [
      {
        id: "vijana-kamati-1",
        name: "Pr. Emmanuel Mollel",
        title: "Mwenyekiti",
        bio: "Msimamizi wa mipango ya vijana na uratibu wa semina za malezi."
      },
      {
        id: "vijana-kamati-2",
        name: "Bw. Kelvin Nyoni",
        title: "Katibu",
        bio: "Mratibu wa ratiba, attendance, na taarifa za vikundi vya vijana."
      },
      {
        id: "vijana-kamati-3",
        name: "Bi. Deborah Sanga",
        title: "Mweka Hazina",
        bio: "Msimamizi wa rasilimali za shughuli za vijana na miradi ya huduma."
      }
    ],
    reports: [
      {
        id: "vijana-report-1",
        title: "Ripoti ya Kambi ya Vijana",
        content:
          "Vijana 120 walihudhuria kambi ya siku 3 yenye mafunzo ya leadership, worship, na mission outreach.",
        date: toIsoAt(subDays(now, 16), 11),
        author: "Pr. Emmanuel Mollel"
      },
      {
        id: "vijana-report-2",
        title: "Ripoti ya Outreach ya Vijana",
        content:
          "Timu ya vijana ilitembelea kata mbili na kuendesha semina ya afya na maombi kwa jamii.",
        date: toIsoAt(subDays(now, 5), 10),
        author: "Bw. Kelvin Nyoni"
      }
    ]
  },
  {
    id: "idara-wanawake",
    name: "Idara ya Wanawake",
    category: "Malezi",
    description:
      "Idara ya kina mama kwa maombi, malezi ya familia, ushauri wa ndoa, na huduma za upendo kwa jamii.",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
    committee: [
      {
        id: "wanawake-kamati-1",
        name: "Bi. Stella Mwakipesile",
        title: "Mwenyekiti",
        bio: "Anaratibu huduma za maombi na semina za familia kwa kina mama."
      },
      {
        id: "wanawake-kamati-2",
        name: "Bi. Ruth Ndejembi",
        title: "Katibu",
        bio: "Msimamizi wa kumbukumbu, matangazo na ratiba za idara."
      },
      {
        id: "wanawake-kamati-3",
        name: "Bi. Hadija Mndeme",
        title: "Mjumbe",
        bio: "Mratibu wa huduma za ziara kwa wagonjwa na familia zenye uhitaji."
      }
    ],
    reports: [
      {
        id: "wanawake-report-1",
        title: "Ripoti ya Semina ya Familia",
        content:
          "Semina ya siku mbili ilihusisha wanandoa 68 na kutoa mafunzo juu ya mawasiliano ya kifamilia.",
        date: toIsoAt(subDays(now, 14), 14),
        author: "Bi. Stella Mwakipesile"
      }
    ]
  },
  {
    id: "idara-ushirika",
    name: "Idara ya Ushirika",
    category: "Ushirika",
    description:
      "Kuratibu mapokezi, ufuatiliaji wa wageni, na kuwaunganisha waumini wapya kwenye maisha ya kanisa.",
    image:
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80",
    committee: [
      {
        id: "ushirika-kamati-1",
        name: "Mzee Paulo Mushi",
        title: "Mwenyekiti",
        bio: "Mratibu wa mapokezi na ushirikishwaji wa wageni wapya kanisani."
      },
      {
        id: "ushirika-kamati-2",
        name: "Bi. Ester Chuwa",
        title: "Katibu",
        bio: "Msimamizi wa taarifa za wageni, mawasiliano, na ziara za ufuatiliaji."
      }
    ],
    reports: [
      {
        id: "ushirika-report-1",
        title: "Ripoti ya Ufuatiliaji wa Wageni",
        content:
          "Wageni 34 walitembelewa ndani ya wiki nne na 16 wameanza kuhudhuria ibada za mara kwa mara.",
        date: toIsoAt(subDays(now, 9), 12),
        author: "Mzee Paulo Mushi"
      }
    ]
  },
  {
    id: "idara-uinjilisti",
    name: "Idara ya Uinjilisti",
    category: "Uinjilisti",
    description:
      "Kurahisisha kuhubiri injili, mikutano ya hadhara, vikundi vya maombi, na huduma za outreach.",
    image:
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
    committee: [
      {
        id: "uinjilisti-kamati-1",
        name: "Mzee Lucas Mtema",
        title: "Mwenyekiti",
        bio: "Anasimamia mikakati ya uinjilisti wa mtaa kwa mtaa."
      },
      {
        id: "uinjilisti-kamati-2",
        name: "Bw. Peter Mjema",
        title: "Mjumbe",
        bio: "Mratibu wa vikundi vya Bible study na outreach teams."
      }
    ],
    reports: [
      {
        id: "uinjilisti-report-1",
        title: "Ripoti ya Uinjilisti wa Robo ya Kwanza",
        content:
          "Watu 46 walibatizwa, makundi 7 ya maombi yaliimarishwa, na semina 4 za jamii zilifanyika.",
        date: toIsoAt(subDays(now, 8), 12),
        author: "Mzee Lucas Mtema"
      }
    ]
  }
];

export const departmentCategories = Array.from(
  new Set(departments.map((department) => department.category))
);

export const leaders: Leader[] = [
  {
    id: "leader-1",
    name: "Pr. Joseph Mwang'onda",
    role: "Mchungaji Kiongozi",
    bio: "Anasimamia huduma za kiroho, mafundisho ya neno, na maono ya kanisa kwa ujumla.",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "leader-2",
    name: "Mzee Annaeli Mrema",
    role: "Mzee wa Kanisa",
    bio: "Mratibu wa malezi ya kiroho, ushauri wa ndoa/familia, na huduma za maombi.",
    image:
      "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "leader-3",
    name: "Bi. Juliana Mboya",
    role: "Katibu wa Kanisa",
    bio: "Msimamizi wa taarifa rasmi, ratiba, kumbukumbu, na mawasiliano ya uongozi.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "leader-4",
    name: "Bw. Nehemiah Kimaro",
    role: "Mweka Hazina",
    bio: "Anasimamia uwazi wa mapato/matumizi na usimamizi wa miradi ya maendeleo ya kanisa.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"
  }
];

export const groups: Group[] = [
  {
    id: "group-1",
    name: "Kwaya ya Makulu Praise",
    type: "Kwaya",
    description: "Huduma ya nyimbo za ibada na matamasha ya injili ndani na nje ya kanisa.",
    youtubeChannelLink: "https://www.youtube.com/@AdventistChurch",
    youtubeVideoLink: "https://www.youtube.com/watch?v=9No-FiEInLA",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "group-2",
    name: "Pathfinders Makulu",
    type: "Vijana",
    description: "Kikundi cha vijana kwa mafunzo ya nidhamu, leadership, huduma na mission.",
    youtubeChannelLink: "https://www.youtube.com/@pathfinderclub",
    youtubeVideoLink: "https://www.youtube.com/watch?v=8Y0fM4FJQvQ",
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "group-3",
    name: "Huduma ya Akina Mama",
    type: "Wanawake",
    description: "Ibada za maombi, semina za familia, na huduma za upendo kwa jamii ya jirani.",
    youtubeChannelLink: "https://www.youtube.com/@adventistwomensministries",
    youtubeVideoLink: "https://www.youtube.com/watch?v=NuT5KUA7iaY",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80"
  }
];

export const reports = departments
  .flatMap((department) =>
    department.reports.map((report) => ({
      id: report.id,
      title: report.title,
      department: department.name,
      author: report.author,
      date: report.date,
      excerpt: report.content
    }))
  )
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 6);

export const sermons = [
  {
    id: "sermon-1",
    title: "Tumaini Katika Nyakati Ngumu",
    preacher: "Pr. Joseph Mwang'onda",
    date: toIsoAt(subDays(now, 3), 14),
    youtubeId: "9No-FiEInLA"
  },
  {
    id: "sermon-2",
    title: "Imani Inayofanya Kazi",
    preacher: "Mzee Annaeli Mrema",
    date: toIsoAt(subDays(now, 10), 14),
    youtubeId: "8Y0fM4FJQvQ"
  },
  {
    id: "sermon-3",
    title: "Neema na Ukombozi",
    preacher: "Bi. Juliana Mboya",
    date: toIsoAt(subDays(now, 17), 14),
    youtubeId: "NuT5KUA7iaY"
  }
];

export const contactDetails = {
  phone: "+255 7xx xxx xxx",
  email: "info@makulusda.org",
  address: "Makulu, Dodoma, Tanzania",
  mapEmbed: "https://www.google.com/maps?q=Makulu%20Dodoma&output=embed",
  socials: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com" },
    { id: "youtube", label: "YouTube", href: "https://youtube.com" },
    { id: "instagram", label: "Instagram", href: "https://instagram.com" }
  ]
};
