import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchSiteSettings,
  normalizeUploadPath,
  resolvePublicUploadUrl,
  updateSiteSettings,
  uploadSiteDocument,
  uploadSiteImage
} from "@/services/adminService";
import AppDropdown from "@/components/common/AppDropdown";

type SiteSettingsForm = {
  churchName: string;
  logoUrl: string;
  themeColor: string;
  faviconUrl: string;
  footerText: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  facebook: string;
  youtube: string;
  instagram: string;
  whatsapp: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  mapLatitude: string;
  mapLongitude: string;
  mapZoom: string;
  mapLabel: string;
  aboutTitle: string;
  aboutContent: string;
  aboutImageUrl: string;
  aboutImageAlt: string;
};

type QuickLinkForm = {
  id: string;
  label: string;
  href: string;
};

type CarouselSlideForm = {
  id: string;
  imageUrl: string;
  badge: string;
  title: string;
  scripture: string;
  description: string;
  brightness: "dark" | "light";
};

type MissionCardForm = {
  id: string;
  reference: string;
  content: string;
};

type MissionSectionForm = {
  sectionTitle: string;
  statementTitle: string;
  statementQuote: string;
  imageUrl: string;
  imageAlt: string;
  scriptureCards: MissionCardForm[];
};

type LibraryItemForm = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  fileName: string;
  uploadedAt: string;
};

type SettingsTab =
  | "carousel"
  | "mission"
  | "branding"
  | "contacts"
  | "map"
  | "about"
  | "library"
  | "links"
  | "seo";

type AdminSiteSettingsPageProps = {
  forcedTab?: SettingsTab;
};

const MAX_CAROUSEL_SLIDES = 4;
const MAX_MISSION_CARDS = 3;
const MAX_QUICK_LINKS = 8;
const LIBRARY_ITEMS_PER_PAGE = 10;
const carouselBrightnessOptions = [
  { value: "dark", label: "Dark Background" },
  { value: "light", label: "Light Background" }
];

function normalizeSettingsTab(input: string | null): SettingsTab {
  if (input === "carousel") return "carousel";
  if (input === "mission") return "mission";
  if (input === "branding") return "branding";
  if (input === "contacts") return "contacts";
  if (input === "map") return "map";
  if (input === "about") return "about";
  if (input === "library") return "library";
  if (input === "links") return "links";
  if (input === "seo") return "seo";
  return "carousel";
}

const defaultForm: SiteSettingsForm = {
  churchName: "",
  logoUrl: "",
  themeColor: "#2543e2",
  faviconUrl: "",
  footerText: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  facebook: "",
  youtube: "",
  instagram: "",
  whatsapp: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  mapLatitude: "",
  mapLongitude: "",
  mapZoom: "15",
  mapLabel: "",
  aboutTitle: "",
  aboutContent: "",
  aboutImageUrl: "",
  aboutImageAlt: ""
};

const defaultQuickLinks: QuickLinkForm[] = [
  { id: "quick-home", label: "Home", href: "/" },
  { id: "quick-idara", label: "Idara", href: "/idara" },
  { id: "quick-viongozi", label: "Viongozi", href: "/viongozi" },
  { id: "quick-vikundi", label: "Vikundi", href: "/vikundi" },
  { id: "quick-matangazo", label: "Matangazo", href: "/matangazo" },
  { id: "quick-mawasiliano", label: "Mawasiliano", href: "/#mawasiliano" }
];

const defaultMissionCards: MissionCardForm[] = [
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
];

const defaultMissionSection: MissionSectionForm = {
  sectionTitle: "UTUME WETU",
  statementTitle:
    "We are a church rooted in the community, dedicated to fulfilling the Great Commission from Matthew 28:19-20.",
  statementQuote:
    '"Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you."',
  imageUrl:
    "https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=1200&q=85",
  imageAlt: "Mission illustration",
  scriptureCards: defaultMissionCards
};

function createEmptySlide(): CarouselSlideForm {
  return {
    id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    imageUrl: "",
    badge: "",
    title: "",
    scripture: "",
    description: "",
    brightness: "dark"
  };
}

function normalizeSlides(input: unknown): CarouselSlideForm[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, MAX_CAROUSEL_SLIDES)
    .map((item: any, index) => {
      const brightness: CarouselSlideForm["brightness"] =
        item?.brightness === "light" ? "light" : "dark";
      return {
        id: String(item?.id || `slide-${index + 1}`),
        imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || "")),
        badge: String(item?.badge || ""),
        title: String(item?.title || ""),
        scripture: String(item?.scripture || ""),
        description: String(item?.description || ""),
        brightness
      };
    })
    .filter((slide) => slide.title || slide.imageUrl);
}

function normalizeMissionSection(input: unknown): MissionSectionForm {
  if (!input || typeof input !== "object") {
    return {
      ...defaultMissionSection,
      scriptureCards: defaultMissionSection.scriptureCards.map((card) => ({ ...card }))
    };
  }

  const raw = input as any;
  const cardsInput = Array.isArray(raw.scriptureCards) ? raw.scriptureCards : [];
  const cards = cardsInput.slice(0, MAX_MISSION_CARDS).map((item: any, index: number): MissionCardForm => ({
    id: String(item?.id || `mission-card-${index + 1}`),
    reference: String(item?.reference ?? ""),
    content: String(item?.content ?? "")
  }));

  while (cards.length < MAX_MISSION_CARDS) {
    cards.push({
      id: `mission-card-${cards.length + 1}`,
      reference: "",
      content: ""
    });
  }

  return {
    sectionTitle: String(raw.sectionTitle ?? ""),
    statementTitle: String(raw.statementTitle ?? ""),
    statementQuote: String(raw.statementQuote ?? ""),
    imageUrl: resolvePublicUploadUrl(String(raw.imageUrl ?? "")),
    imageAlt: String(raw.imageAlt ?? ""),
    scriptureCards: cards
  };
}

function normalizeQuickLinks(input: unknown): QuickLinkForm[] {
  if (!Array.isArray(input)) return defaultQuickLinks.map((link) => ({ ...link }));

  const links = input
    .slice(0, MAX_QUICK_LINKS)
    .map((item: any, index): QuickLinkForm => ({
      id: String(item?.id || `quick-link-${index + 1}`),
      label: String(item?.label || "").trim(),
      href: String(item?.href || "").trim()
    }))
    .filter((link) => link.label || link.href);

  return links.length > 0 ? links : defaultQuickLinks.map((link) => ({ ...link }));
}

function normalizeLibraryItems(input: unknown): LibraryItemForm[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 200)
    .map((item: any, index): LibraryItemForm => ({
      id: String(item?.id || `library-item-${index + 1}`),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      pdfUrl: resolvePublicUploadUrl(String(item?.pdfUrl || "").trim()),
      fileName: String(item?.fileName || "").trim(),
      uploadedAt: String(item?.uploadedAt || "").trim()
    }))
    .filter((item) => item.title && item.pdfUrl);
}

function buildPdfPreviewUrl(url: string) {
  if (!url) return "";
  const hashParams = "page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit";
  return url.includes("#") ? `${url}&${hashParams}` : `${url}#${hashParams}`;
}

function SectionIcon({ type }: { type: "carousel" | "mission" | "settings" }) {
  if (type === "carousel") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 15l3-3 2 2 3-3 2 2" />
      </svg>
    );
  }

  if (type === "mission") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4Z" />
        <path d="M9.5 12l1.8 1.8 3.2-3.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.07 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.07-.4H2.9a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.07-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.07V2.9a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.07 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.07.4h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.07.4 1.7 1.7 0 0 0-.6 1Z" />
    </svg>
  );
}

export default function AdminSiteSettingsPage({ forcedTab }: AdminSiteSettingsPageProps = {}) {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = forcedTab ?? normalizeSettingsTab(searchParams.get("section"));
  const isStandaloneLibrary = forcedTab === "library";
  const [form, setForm] = useState<SiteSettingsForm>(defaultForm);
  const [quickLinks, setQuickLinks] = useState<QuickLinkForm[]>(
    defaultQuickLinks.map((link) => ({ ...link }))
  );
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlideForm[]>([]);
  const [carouselDraft, setCarouselDraft] = useState<CarouselSlideForm>(createEmptySlide());
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const [carouselPendingImageFile, setCarouselPendingImageFile] = useState<File | null>(null);
  const [carouselPendingImagePreview, setCarouselPendingImagePreview] = useState("");
  const [isUploadingCarouselImage, setIsUploadingCarouselImage] = useState(false);
  const [missionSection, setMissionSection] = useState<MissionSectionForm>(defaultMissionSection);
  const [missionPendingImageFile, setMissionPendingImageFile] = useState<File | null>(null);
  const [missionPendingImagePreview, setMissionPendingImagePreview] = useState("");
  const [isUploadingMissionImage, setIsUploadingMissionImage] = useState(false);
  const [aboutPendingImageFile, setAboutPendingImageFile] = useState<File | null>(null);
  const [aboutPendingImagePreview, setAboutPendingImagePreview] = useState("");
  const [isUploadingAboutImage, setIsUploadingAboutImage] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItemForm[]>([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [libraryDialogMode, setLibraryDialogMode] = useState<"add" | "edit">("add");
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [libraryFormTitle, setLibraryFormTitle] = useState("");
  const [libraryFormDescription, setLibraryFormDescription] = useState("");
  const [libraryFormFile, setLibraryFormFile] = useState<File | null>(null);
  const [isSavingLibraryAction, setIsSavingLibraryAction] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [savingSection, setSavingSection] = useState<SettingsTab | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(fetchSiteSettings, []);

  useEffect(() => {
    if (!data) return;

    setForm({
      churchName: String(data.churchName || ""),
      logoUrl: String(data.logoUrl || ""),
      themeColor: String(data.themeColor || "#2543e2"),
      faviconUrl: String(data.faviconUrl || ""),
      footerText: String(data.footerText || ""),
      contactPhone: String((data.contactInfo as any)?.phone || ""),
      contactEmail: String((data.contactInfo as any)?.email || ""),
      contactAddress: String((data.contactInfo as any)?.address || ""),
      facebook: String((data.socialLinks as any)?.facebook || ""),
      youtube: String((data.socialLinks as any)?.youtube || ""),
      instagram: String((data.socialLinks as any)?.instagram || ""),
      whatsapp: String((data.socialLinks as any)?.whatsapp || ""),
      seoTitle: String((data.seo as any)?.title || ""),
      seoDescription: String((data.seo as any)?.description || ""),
      seoKeywords: String((data.seo as any)?.keywords || ""),
      mapLatitude: String((data.mapLocation as any)?.latitude ?? ""),
      mapLongitude: String((data.mapLocation as any)?.longitude ?? ""),
      mapZoom: String((data.mapLocation as any)?.zoom ?? "15"),
      mapLabel: String((data.mapLocation as any)?.label || ""),
      aboutTitle: String((data.aboutChurch as any)?.title || ""),
      aboutContent: String((data.aboutChurch as any)?.content || ""),
      aboutImageUrl: resolvePublicUploadUrl(String((data.aboutChurch as any)?.imageUrl || "")),
      aboutImageAlt: String((data.aboutChurch as any)?.imageAlt || "")
    });

    setCarouselSlides(normalizeSlides((data as any).heroCarousel));
    setMissionSection(normalizeMissionSection((data as any).missionSection));
    setQuickLinks(normalizeQuickLinks((data as any).quickLinks));
    setLibraryItems(normalizeLibraryItems((data as any).libraryItems));
  }, [data]);

  useEffect(() => {
    return () => {
      if (carouselPendingImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(carouselPendingImagePreview);
      }
    };
  }, [carouselPendingImagePreview]);

  useEffect(() => {
    return () => {
      if (missionPendingImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(missionPendingImagePreview);
      }
    };
  }, [missionPendingImagePreview]);

  useEffect(() => {
    return () => {
      if (aboutPendingImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(aboutPendingImagePreview);
      }
    };
  }, [aboutPendingImagePreview]);

  const handleInput = (field: keyof SiteSettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMissionInput = (
    field: keyof Omit<MissionSectionForm, "scriptureCards">,
    value: string
  ) => {
    setMissionSection((prev) => ({ ...prev, [field]: value }));
  };

  const handleMissionCardInput = (
    index: number,
    field: keyof Omit<MissionCardForm, "id">,
    value: string
  ) => {
    setMissionSection((prev) => ({
      ...prev,
      scriptureCards: prev.scriptureCards.map((card, i) =>
        i === index ? { ...card, [field]: value } : card
      )
    }));
  };

  const handleQuickLinkInput = (
    index: number,
    field: keyof Omit<QuickLinkForm, "id">,
    value: string
  ) => {
    setQuickLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const addQuickLink = () => {
    if (quickLinks.length >= MAX_QUICK_LINKS) {
      toast.error(`You can only keep up to ${MAX_QUICK_LINKS} quick links.`);
      return;
    }

    setQuickLinks((prev) => [
      ...prev,
      {
        id: `quick-link-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: "",
        href: ""
      }
    ]);
  };

  const removeQuickLink = (index: number) => {
    setQuickLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const resetCarouselEditor = () => {
    setEditorIndex(null);
    setCarouselDraft(createEmptySlide());
    setCarouselPendingImageFile(null);
    if (carouselPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(carouselPendingImagePreview);
    }
    setCarouselPendingImagePreview("");
  };

  const clearMissionPendingImage = () => {
    setMissionPendingImageFile(null);
    if (missionPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(missionPendingImagePreview);
    }
    setMissionPendingImagePreview("");
  };

  const openAddSlide = () => {
    if (carouselSlides.length >= MAX_CAROUSEL_SLIDES) {
      toast.error(`You can only keep up to ${MAX_CAROUSEL_SLIDES} slides.`);
      return;
    }
    resetCarouselEditor();
    setEditorIndex(-1);
  };

  const openEditSlide = (index: number) => {
    if (carouselPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(carouselPendingImagePreview);
    }
    setCarouselPendingImageFile(null);
    setCarouselPendingImagePreview("");
    setCarouselDraft({ ...carouselSlides[index] });
    setEditorIndex(index);
  };

  const handleCarouselImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (carouselPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(carouselPendingImagePreview);
    }

    setCarouselPendingImageFile(file);
    setCarouselPendingImagePreview(URL.createObjectURL(file));
    toast.success("Image selected. Click Save Slide to publish.");
    event.target.value = "";
  };

  const handleMissionImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (missionPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(missionPendingImagePreview);
    }

    setMissionPendingImageFile(file);
    setMissionPendingImagePreview(URL.createObjectURL(file));
    toast.success("Mission image selected. Click Save Mission Section to publish.");
    event.target.value = "";
  };

  const clearAboutPendingImage = () => {
    setAboutPendingImageFile(null);
    if (aboutPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(aboutPendingImagePreview);
    }
    setAboutPendingImagePreview("");
  };

  const handleAboutImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (aboutPendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(aboutPendingImagePreview);
    }

    setAboutPendingImageFile(file);
    setAboutPendingImagePreview(URL.createObjectURL(file));
    toast.success("Kuhusu Kanisa image selected. Click Save Kuhusu Kanisa to publish.");
    event.target.value = "";
  };

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation haipatikani kwenye browser hii.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          mapLatitude: position.coords.latitude.toFixed(6),
          mapLongitude: position.coords.longitude.toFixed(6),
          mapLabel: prev.mapLabel || prev.churchName || "Kanisa"
        }));
        setIsDetectingLocation(false);
        toast.success("Live location imechukuliwa.");
      },
      () => {
        setIsDetectingLocation(false);
        toast.error("Imeshindikana kupata live location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const openAddLibraryDialog = () => {
    setLibraryDialogMode("add");
    setEditingLibraryId(null);
    setLibraryFormTitle("");
    setLibraryFormDescription("");
    setLibraryFormFile(null);
    setLibraryDialogOpen(true);
  };

  const openEditLibraryDialog = (item: LibraryItemForm) => {
    setLibraryDialogMode("edit");
    setEditingLibraryId(item.id);
    setLibraryFormTitle(item.title);
    setLibraryFormDescription(item.description);
    setLibraryFormFile(null);
    setLibraryDialogOpen(true);
  };

  const closeLibraryDialog = () => {
    setLibraryDialogOpen(false);
    setEditingLibraryId(null);
    setLibraryFormTitle("");
    setLibraryFormDescription("");
    setLibraryFormFile(null);
  };

  const buildLibraryItemsPayload = (items: LibraryItemForm[]) =>
    items.map((item, index) => ({
      id: item.id || `library-item-${index + 1}`,
      title: item.title.trim(),
      description: item.description.trim(),
      pdfUrl: normalizeUploadPath(item.pdfUrl),
      fileName: item.fileName.trim(),
      uploadedAt: item.uploadedAt || new Date().toISOString()
    }));

  const persistLibraryItems = async (items: LibraryItemForm[], successMessage: string) => {
    try {
      setIsSavingLibraryAction(true);
      await updateSiteSettings({
        libraryItems: buildLibraryItemsPayload(items)
      });
      setLibraryItems(items);
      toast.success(successMessage);
      await refetch();
      return true;
    } catch {
      toast.error("Imeshindikana kuhifadhi mabadiliko ya maktaba.");
      return false;
    } finally {
      setIsSavingLibraryAction(false);
    }
  };

  const submitLibraryDialog = async () => {
    const title = libraryFormTitle.trim();
    const description = libraryFormDescription.trim();

    if (!title) {
      toast.error("Weka title ya PDF.");
      return;
    }

    if (libraryDialogMode === "add" && !libraryFormFile) {
      toast.error("Chagua PDF file kwanza.");
      return;
    }

    try {
      setIsSavingLibraryAction(true);

      if (libraryDialogMode === "add") {
        const uploaded = await uploadSiteDocument(libraryFormFile as File);
        if (!uploaded.url) {
          throw new Error("Missing uploaded url.");
        }

        const nextItem: LibraryItemForm = {
          id: `library-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title,
          description,
          pdfUrl: uploaded.url,
          fileName: uploaded.fileName || (libraryFormFile as File).name,
          uploadedAt: new Date().toISOString()
        };

        const success = await persistLibraryItems([nextItem, ...libraryItems], "PDF imeongezwa kwenye maktaba.");
        if (success) closeLibraryDialog();
        return;
      }

      if (!editingLibraryId) {
        toast.error("Hakuna item ya ku-edit.");
        return;
      }

      const target = libraryItems.find((item) => item.id === editingLibraryId);
      if (!target) {
        toast.error("Item haijapatikana.");
        return;
      }

      let nextPdfUrl = target.pdfUrl;
      let nextFileName = target.fileName;
      let nextUploadedAt = target.uploadedAt || new Date().toISOString();

      if (libraryFormFile) {
        const uploaded = await uploadSiteDocument(libraryFormFile);
        if (!uploaded.url) {
          throw new Error("Missing uploaded url.");
        }
        nextPdfUrl = uploaded.url;
        nextFileName = uploaded.fileName || libraryFormFile.name;
        nextUploadedAt = new Date().toISOString();
      }

      const nextItems = libraryItems.map((item) =>
        item.id === editingLibraryId
          ? {
              ...item,
              title,
              description,
              pdfUrl: nextPdfUrl,
              fileName: nextFileName,
              uploadedAt: nextUploadedAt
            }
          : item
      );

      const success = await persistLibraryItems(nextItems, "PDF details zimehaririwa.");
      if (success) closeLibraryDialog();
    } catch {
      toast.error("Imeshindikana kuhifadhi PDF.");
    } finally {
      setIsSavingLibraryAction(false);
    }
  };

  const deleteLibraryPdf = async (id: string) => {
    if (!window.confirm("Unataka kufuta PDF hii?")) return;
    const nextItems = libraryItems.filter((item) => item.id !== id);
    await persistLibraryItems(nextItems, "PDF imefutwa kutoka maktaba.");
  };

  const buildSlidesFromDraft = async (): Promise<CarouselSlideForm[] | null> => {
    if (editorIndex === null) return carouselSlides;

    let nextImageUrl = carouselDraft.imageUrl.trim();

    if (carouselPendingImageFile) {
      try {
        setIsUploadingCarouselImage(true);
        const uploadedUrl = await uploadSiteImage(carouselPendingImageFile);
        if (!uploadedUrl) throw new Error("No image path returned.");
        nextImageUrl = uploadedUrl;
      } catch {
        toast.error("Failed to upload image.");
        return null;
      } finally {
        setIsUploadingCarouselImage(false);
      }
    }

    const nextDraft: CarouselSlideForm = {
      ...carouselDraft,
      imageUrl: nextImageUrl,
      title: carouselDraft.title.trim(),
      scripture: carouselDraft.scripture.trim(),
      description: carouselDraft.description.trim()
    };

    if (!nextDraft.imageUrl || !nextDraft.title) {
      toast.error("Slide image and title are required.");
      return null;
    }

    if (editorIndex === -1) {
      if (carouselSlides.length >= MAX_CAROUSEL_SLIDES) {
        toast.error(`Maximum ${MAX_CAROUSEL_SLIDES} slides allowed.`);
        return null;
      }
      return [...carouselSlides, nextDraft];
    }

    return carouselSlides.map((slide, index) => (index === editorIndex ? nextDraft : slide));
  };

  const saveSlide = async () => {
    const nextSlides = await buildSlidesFromDraft();
    if (!nextSlides) return;

    try {
      setSavingSection("carousel");
      setCarouselSlides(nextSlides);
      await updateSiteSettings({
        heroCarousel: nextSlides
      });
      resetCarouselEditor();
      toast.success("Slide saved to database.");
      await refetch();
    } catch {
      toast.error("Failed to save slide.");
    } finally {
      setSavingSection(null);
    }
  };

  const removeSlide = async (index: number) => {
    const nextSlides = carouselSlides.filter((_, i) => i !== index);

    try {
      setSavingSection("carousel");
      setCarouselSlides(nextSlides);

      if (editorIndex === index) {
        resetCarouselEditor();
      }

      await updateSiteSettings({
        heroCarousel: nextSlides
      });
      toast.success("Slide removed and database updated.");
      await refetch();
    } catch {
      toast.error("Failed to remove slide.");
    } finally {
      setSavingSection(null);
    }
  };

  const sitePreview = useMemo(() => {
    return {
      title: form.seoTitle || form.churchName,
      description: form.seoDescription || "",
      color: form.themeColor
    };
  }, [form]);

  const totalLibraryPages = Math.max(1, Math.ceil(libraryItems.length / LIBRARY_ITEMS_PER_PAGE));
  const libraryStartIndex = (libraryPage - 1) * LIBRARY_ITEMS_PER_PAGE;
  const libraryEndIndex = Math.min(libraryStartIndex + LIBRARY_ITEMS_PER_PAGE, libraryItems.length);
  const paginatedLibraryItems = useMemo(
    () => libraryItems.slice(libraryStartIndex, libraryStartIndex + LIBRARY_ITEMS_PER_PAGE),
    [libraryItems, libraryStartIndex]
  );
  const editingLibraryItem = useMemo(
    () => libraryItems.find((item) => item.id === editingLibraryId) || null,
    [editingLibraryId, libraryItems]
  );

  useEffect(() => {
    setLibraryPage(1);
  }, [libraryItems.length]);

  useEffect(() => {
    if (libraryPage > totalLibraryPages) {
      setLibraryPage(totalLibraryPages);
    }
  }, [libraryPage, totalLibraryPages]);

  const setActiveTab = (tab: SettingsTab) => {
    if (forcedTab) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", tab);
    setSearchParams(nextParams, { replace: true });
  };

  const tabClass = (tab: SettingsTab) =>
    `admin-topbar-btn ${
      activeTab === tab
        ? isDark
          ? "border-church-300/60 bg-white/[0.15] text-white ring-1 ring-white/30"
          : "border-church-500/50 bg-church-50 text-church-800 ring-1 ring-church-200"
        : ""
    }`;

  const handleReload = async () => {
    try {
      await refetch();
      toast.success("Settings reloaded.");
    } catch {
      toast.error("Failed to reload settings.");
    }
  };

  const handleSaveCarousel = async () => {
    try {
      setSavingSection("carousel");
      let slidesToSave = carouselSlides;

      if (editorIndex !== null) {
        const stagedSlides = await buildSlidesFromDraft();
        if (!stagedSlides) {
          setSavingSection(null);
          return;
        }
        slidesToSave = stagedSlides;
        setCarouselSlides(stagedSlides);
        resetCarouselEditor();
      }

      await updateSiteSettings({
        heroCarousel: slidesToSave
      });
      toast.success("Carousel saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save carousel.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveMissionSection = async () => {
    try {
      setSavingSection("mission");
      let nextImageUrl = missionSection.imageUrl.trim();

      if (missionPendingImageFile) {
        try {
          setIsUploadingMissionImage(true);
          const uploadedUrl = await uploadSiteImage(missionPendingImageFile);
          if (!uploadedUrl) throw new Error("No image path returned.");
          nextImageUrl = uploadedUrl;
        } catch {
          toast.error("Failed to upload mission image.");
          return;
        } finally {
          setIsUploadingMissionImage(false);
        }
      }

      const updated = await updateSiteSettings({
        missionSection: {
          sectionTitle: missionSection.sectionTitle.trim(),
          statementTitle: missionSection.statementTitle.trim(),
          statementQuote: missionSection.statementQuote.trim(),
          imageUrl: nextImageUrl,
          imageAlt: missionSection.imageAlt.trim(),
          scriptureCards: missionSection.scriptureCards.map((card, index) => ({
            id: card.id || `mission-card-${index + 1}`,
            reference: card.reference.trim(),
            content: card.content.trim()
          }))
        }
      });

      setMissionSection(normalizeMissionSection((updated as any)?.missionSection));
      clearMissionPendingImage();
      toast.success("Mission section saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save mission section.");
    } finally {
      setSavingSection(null);
    }
  };

  const buildQuickLinksPayload = () =>
    quickLinks
      .map((link, index) => ({
        id: link.id || `quick-link-${index + 1}`,
        label: link.label.trim(),
        href: link.href.trim()
      }))
      .filter((link) => link.label && link.href);

  const handleSaveBranding = async () => {
    try {
      setSavingSection("branding");
      await updateSiteSettings({
        churchName: form.churchName,
        logoUrl: form.logoUrl,
        themeColor: form.themeColor,
        faviconUrl: form.faviconUrl
      });
      toast.success("Branding saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save branding.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveContacts = async () => {
    try {
      setSavingSection("contacts");
      await updateSiteSettings({
        contactInfo: {
          phone: form.contactPhone,
          email: form.contactEmail,
          address: form.contactAddress
        },
        socialLinks: {
          facebook: form.facebook,
          youtube: form.youtube,
          instagram: form.instagram,
          whatsapp: form.whatsapp
        }
      });
      toast.success("Contacts saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save contacts.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveMap = async () => {
    try {
      setSavingSection("map");
      const latitude = Number(form.mapLatitude);
      const longitude = Number(form.mapLongitude);
      const zoom = Number(form.mapZoom);
      await updateSiteSettings({
        mapLocation: {
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
          zoom: Number.isFinite(zoom) ? zoom : 15,
          label: form.mapLabel.trim()
        }
      });
      toast.success("Map settings saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save map settings.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAbout = async () => {
    try {
      setSavingSection("about");
      let nextAboutImageUrl = form.aboutImageUrl.trim();

      if (aboutPendingImageFile) {
        try {
          setIsUploadingAboutImage(true);
          const uploadedUrl = await uploadSiteImage(aboutPendingImageFile);
          if (!uploadedUrl) throw new Error("No image path returned.");
          nextAboutImageUrl = uploadedUrl;
        } catch {
          toast.error("Failed to upload kuhusu kanisa image.");
          return;
        } finally {
          setIsUploadingAboutImage(false);
        }
      }

      await updateSiteSettings({
        aboutChurch: {
          title: form.aboutTitle.trim(),
          content: form.aboutContent.trim(),
          imageUrl: nextAboutImageUrl,
          imageAlt: form.aboutImageAlt.trim()
        }
      });

      setForm((prev) => ({ ...prev, aboutImageUrl: nextAboutImageUrl }));
      clearAboutPendingImage();
      toast.success("Kuhusu Kanisa saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save kuhusu kanisa.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveQuickLinks = async () => {
    try {
      setSavingSection("links");
      await updateSiteSettings({
        quickLinks: buildQuickLinksPayload()
      });
      toast.success("Quick links saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save quick links.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSeoFooter = async () => {
    try {
      setSavingSection("seo");
      await updateSiteSettings({
        seo: {
          title: form.seoTitle,
          description: form.seoDescription,
          keywords: form.seoKeywords
        },
        footerText: form.footerText
      });
      toast.success("SEO and footer saved successfully.");
      await refetch();
    } catch {
      toast.error("Failed to save SEO and footer.");
    } finally {
      setSavingSection(null);
    }
  };

  if (isLoading) return <p className="text-sm text-slate-300">Loading settings...</p>;
  if (error) return <p className="text-sm text-rose-300">Failed to load settings.</p>;

  return (
    <div className="space-y-5">
      <header className="rounded-md bg-white/[0.03] p-4">
        <h1 className="text-2xl font-bold text-white">{isStandaloneLibrary ? "Maktaba" : "Settings"}</h1>
        <p className="text-sm text-slate-300">
          {isStandaloneLibrary
            ? "Simamia PDF za maktaba kama sehemu huru kwenye admin sidebar."
            : "Manage homepage carousel, mission section, and core website settings."}
        </p>
      </header>

      {!forcedTab ? (
      <nav className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/[0.02] p-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={tabClass("carousel")} onClick={() => setActiveTab("carousel")}>
            <SectionIcon type="carousel" />
            Carousel
          </button>
          <button type="button" className={tabClass("mission")} onClick={() => setActiveTab("mission")}>
            <SectionIcon type="mission" />
            Mission Section
          </button>
          <button type="button" className={tabClass("branding")} onClick={() => setActiveTab("branding")}>
            <SectionIcon type="settings" />
            Branding
          </button>
          <button type="button" className={tabClass("contacts")} onClick={() => setActiveTab("contacts")}>
            <SectionIcon type="settings" />
            Contacts
          </button>
          <button type="button" className={tabClass("map")} onClick={() => setActiveTab("map")}>
            <SectionIcon type="settings" />
            Ramani
          </button>
          <button type="button" className={tabClass("about")} onClick={() => setActiveTab("about")}>
            <SectionIcon type="settings" />
            Kuhusu Kanisa
          </button>
          <button type="button" className={tabClass("links")} onClick={() => setActiveTab("links")}>
            <SectionIcon type="settings" />
            Quick Links
          </button>
          <button type="button" className={tabClass("seo")} onClick={() => setActiveTab("seo")}>
            <SectionIcon type="settings" />
            SEO & Footer
          </button>
        </div>
      </nav>
      ) : null}

      {activeTab === "carousel" ? (
        <section className="rounded-md bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="inline-flex items-center gap-2 text-xl font-bold text-white">
              <SectionIcon type="carousel" />
              Carousel Manager
            </h2>
            <p className="text-sm text-slate-300">
              Add and manage homepage hero slides. Max {MAX_CAROUSEL_SLIDES} slides.
            </p>
            <p className="mt-1 text-xs text-church-200/90">Save Slide huhifadhi moja kwa moja kwenye database.</p>
          </div>
          <button type="button" className="admin-btn-primary" onClick={openAddSlide}>
            + Add Slide
          </button>
        </div>

        {editorIndex !== null ? (
          <div className="mt-4 rounded-md bg-[#08133c]/70 p-4">
            <h3 className="text-base font-bold text-white">
              {editorIndex === -1 ? "Add New Slide" : `Edit Slide #${editorIndex + 1}`}
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                Image
                <input
                  className="form-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => void handleCarouselImageUpload(event)}
                  disabled={isUploadingCarouselImage}
                />
                <span className="text-xs text-slate-300">
                  {isUploadingCarouselImage
                    ? "Uploading image..."
                    : carouselPendingImageFile
                      ? "Image selected. Click Save Slide to publish."
                      : carouselDraft.imageUrl
                        ? "Current slide image loaded."
                        : "Pakia picha ya slide hapa."}
                </span>
              </label>

              {(carouselPendingImagePreview || carouselDraft.imageUrl) ? (
                <div className="md:col-span-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                    Image Preview
                  </p>
                  <div className="overflow-hidden rounded-md border border-white/20 bg-slate-900/50">
                    <img
                      src={carouselPendingImagePreview || carouselDraft.imageUrl}
                      alt="Carousel preview"
                      className="h-40 w-full object-cover md:h-52"
                    />
                  </div>
                </div>
              ) : null}

              <label className="grid gap-1 text-sm font-semibold">
                Badge (optional)
                <input
                  className="form-input"
                  placeholder="Mfano: Huduma ya Jamii"
                  value={carouselDraft.badge}
                  onChange={(e) =>
                    setCarouselDraft((prev) => ({ ...prev, badge: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Background Style
                <AppDropdown
                  value={carouselDraft.brightness}
                  options={carouselBrightnessOptions}
                  onChange={(value) =>
                    setCarouselDraft((prev) => ({
                      ...prev,
                      brightness: value === "light" ? "light" : "dark"
                    }))
                  }
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                Slide Title
                <input
                  className="form-input"
                  placeholder="Weka kichwa cha slide"
                  value={carouselDraft.title}
                  onChange={(e) =>
                    setCarouselDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                Scripture
                <input
                  className="form-input"
                  placeholder="Weka andiko"
                  value={carouselDraft.scripture}
                  onChange={(e) =>
                    setCarouselDraft((prev) => ({ ...prev, scripture: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                Description
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Elezea ujumbe wa slide"
                  value={carouselDraft.description}
                  onChange={(e) =>
                    setCarouselDraft((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </label>

            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => void saveSlide()}
                disabled={savingSection === "carousel"}
              >
                {savingSection === "carousel" ? "Saving..." : "Save Slide"}
              </button>
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={resetCarouselEditor}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {carouselSlides.map((slide, index) => (
            <article key={slide.id} className="rounded-md bg-white/[0.03] p-3">
              <div className="aspect-video overflow-hidden rounded-md bg-slate-950/70">
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title || `Slide ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-church-300">
                Slide {index + 1}
              </p>
              <h4 className="text-sm font-bold text-white">{slide.title || "Untitled"}</h4>
              <p className="line-clamp-2 text-xs text-slate-300">
                {slide.description || "No description"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="admin-btn-ghost px-2.5 py-1.5"
                  onClick={() => openEditSlide(index)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-btn-danger px-2.5 py-1.5"
                  onClick={() => void removeSlide(index)}
                  disabled={savingSection === "carousel"}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}

          {carouselSlides.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/20 p-4 text-sm text-slate-400">
              No slides added yet. Click <strong>Add Slide</strong> to start.
            </div>
          ) : null}
        </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="admin-btn-primary"
              type="button"
              onClick={() => void handleSaveCarousel()}
              disabled={savingSection === "carousel"}
            >
              {savingSection === "carousel" ? "Saving..." : "Save Carousel"}
            </button>
            <button className="admin-btn-ghost" type="button" onClick={() => void handleReload()}>
              Reload Data
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "mission" ? (
        <section className="rounded-md bg-white/[0.03] p-4">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-white">
          <SectionIcon type="mission" />
          Mission Section
        </h2>
        <p className="text-sm text-slate-300">
          Edit the "Utume Wetu" section displayed after the homepage carousel.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Section Title
            <input
              className="form-input"
              value={missionSection.sectionTitle}
              onChange={(e) => handleMissionInput("sectionTitle", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Image URL (optional)
            <input
              className="form-input"
              value={missionSection.imageUrl}
              onChange={(e) => handleMissionInput("imageUrl", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold md:col-span-2">
            Mission Image Upload
            <input
              className="form-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => handleMissionImageUpload(event)}
              disabled={isUploadingMissionImage}
            />
            <span className="text-xs text-slate-300">
              {isUploadingMissionImage
                ? "Uploading image..."
                : missionPendingImageFile
                  ? "Image selected. Click Save Mission Section to publish."
                  : missionSection.imageUrl
                    ? "Current mission image loaded."
                    : "Pakia picha ya mission section hapa."}
            </span>
          </label>
        </div>

        {(missionPendingImagePreview || missionSection.imageUrl) ? (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              Mission Image Preview
            </p>
            <div className="overflow-hidden rounded-md border border-white/20 bg-slate-900/50">
              <img
                src={missionPendingImagePreview || missionSection.imageUrl}
                alt="Mission preview"
                className="h-44 w-full object-cover md:h-56"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Statement Heading
            <textarea
              rows={3}
              className="form-input"
              value={missionSection.statementTitle}
              onChange={(e) => handleMissionInput("statementTitle", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Statement Quote
            <textarea
              rows={3}
              className="form-input"
              value={missionSection.statementQuote}
              onChange={(e) => handleMissionInput("statementQuote", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold md:col-span-2">
            Image Alt Text
            <input
              className="form-input"
              value={missionSection.imageAlt}
              onChange={(e) => handleMissionInput("imageAlt", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-white">Scripture Cards</h3>
          <p className="text-xs text-slate-400">These cards appear in the center column of the mission section.</p>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {missionSection.scriptureCards.map((card, index) => (
              <article key={card.id} className="rounded-md bg-[#08133c]/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-church-300">
                  Card {index + 1}
                </p>
                <label className="mt-2 grid gap-1 text-sm font-semibold">
                  Reference
                  <input
                    className="form-input"
                    value={card.reference}
                    onChange={(e) =>
                      handleMissionCardInput(index, "reference", e.target.value)
                    }
                  />
                </label>
                <label className="mt-2 grid gap-1 text-sm font-semibold">
                  Content
                  <textarea
                    rows={4}
                    className="form-input"
                    value={card.content}
                    onChange={(e) =>
                      handleMissionCardInput(index, "content", e.target.value)
                    }
                  />
                </label>
              </article>
            ))}
          </div>
        </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="admin-btn-primary"
              type="button"
              onClick={() => void handleSaveMissionSection()}
              disabled={savingSection === "mission"}
            >
              {savingSection === "mission" ? "Saving..." : "Save Mission Section"}
            </button>
            <button className="admin-btn-ghost" type="button" onClick={() => void handleReload()}>
              Reload Data
            </button>
          </div>
        </section>
      ) : null}

      {activeTab !== "carousel" && activeTab !== "mission" ? (
        <section className="rounded-md bg-white/[0.03] p-4">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-white">
          <SectionIcon type="settings" />
          {activeTab === "branding"
            ? "Branding"
            : activeTab === "contacts"
              ? "Contacts & Social"
              : activeTab === "map"
                ? "Ramani"
                : activeTab === "about"
                  ? "Kuhusu Kanisa"
                  : activeTab === "library"
                    ? "Maktaba"
                    : activeTab === "links"
                      ? "Quick Links"
                      : "SEO & Footer"}
        </h2>
        <p className="text-sm text-slate-300">
          {activeTab === "branding"
            ? "Church identity and visual brand settings."
            : activeTab === "contacts"
              ? "Phone, email, address, and social links."
              : activeTab === "map"
                ? "Map coordinates and labels for church location."
                : activeTab === "about"
                  ? "Title, content, and image for About page."
                  : activeTab === "library"
                    ? "Ongeza na simamia PDF files za kanisa."
                    : activeTab === "links"
                      ? "Topbar/footer links zinazotoka backend."
                      : "Search metadata and footer text."}
        </p>

        {activeTab === "branding" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Church Name
              <input
                className="form-input"
                value={form.churchName}
                onChange={(e) => handleInput("churchName", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Logo URL
              <input
                className="form-input"
                value={form.logoUrl}
                onChange={(e) => handleInput("logoUrl", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Theme Color
              <input
                className="h-11 rounded-md bg-[#0b1743]/80 px-2"
                type="color"
                value={form.themeColor}
                onChange={(e) => handleInput("themeColor", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Favicon URL
              <input
                className="form-input"
                value={form.faviconUrl}
                onChange={(e) => handleInput("faviconUrl", e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {activeTab === "contacts" ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Contact Phone
                <input
                  className="form-input"
                  value={form.contactPhone}
                  onChange={(e) => handleInput("contactPhone", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Contact Email
                <input
                  className="form-input"
                  value={form.contactEmail}
                  onChange={(e) => handleInput("contactEmail", e.target.value)}
                />
              </label>
            </div>

            <label className="mt-3 grid gap-1 text-sm font-semibold">
              Contact Address
              <textarea
                rows={2}
                className="form-input"
                value={form.contactAddress}
                onChange={(e) => handleInput("contactAddress", e.target.value)}
              />
            </label>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Facebook
                <input
                  className="form-input"
                  value={form.facebook}
                  onChange={(e) => handleInput("facebook", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                YouTube
                <input
                  className="form-input"
                  value={form.youtube}
                  onChange={(e) => handleInput("youtube", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Instagram
                <input
                  className="form-input"
                  value={form.instagram}
                  onChange={(e) => handleInput("instagram", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                WhatsApp
                <input
                  className="form-input"
                  value={form.whatsapp}
                  onChange={(e) => handleInput("whatsapp", e.target.value)}
                />
              </label>
            </div>
          </>
        ) : null}

        {activeTab === "map" ? (
        <div className="mt-4 rounded-md bg-[#08133c]/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Ramani ya Kanisa</h3>
              <p className="text-xs text-slate-300">
                Tumia live location ili coordinates zijazwe moja kwa moja.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-ghost px-3 py-2"
              onClick={handleUseLiveLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? "Fetching..." : "Chukua Live Location"}
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Latitude
              <input
                className="form-input"
                value={form.mapLatitude}
                readOnly
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Longitude
              <input
                className="form-input"
                value={form.mapLongitude}
                readOnly
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Zoom
              <input
                className="form-input"
                value={form.mapZoom}
                onChange={(e) => handleInput("mapZoom", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Map Label
              <input
                className="form-input"
                value={form.mapLabel}
                onChange={(e) => handleInput("mapLabel", e.target.value)}
              />
            </label>
          </div>
        </div>
        ) : null}

        {activeTab === "about" ? (
        <div className="mt-4 rounded-md bg-[#08133c]/60 p-3">
          <h3 className="text-base font-bold text-white">Kuhusu Kanisa</h3>
          <p className="text-xs text-slate-300">
            Sehemu hii inaonyesha ukurasa wa kuhusu kanisa kwenye frontend.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              Title
              <input
                className="form-input"
                value={form.aboutTitle}
                onChange={(e) => handleInput("aboutTitle", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              Maelezo
              <textarea
                rows={4}
                className="form-input"
                value={form.aboutContent}
                onChange={(e) => handleInput("aboutContent", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Image URL
              <input
                className="form-input"
                value={form.aboutImageUrl}
                onChange={(e) => handleInput("aboutImageUrl", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Image Alt
              <input
                className="form-input"
                value={form.aboutImageAlt}
                onChange={(e) => handleInput("aboutImageAlt", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              Upload Image
              <input
                className="form-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => handleAboutImageUpload(event)}
                disabled={isUploadingAboutImage}
              />
              <span className="text-xs text-slate-300">
                {isUploadingAboutImage
                  ? "Uploading image..."
                  : aboutPendingImageFile
                    ? "Image selected. Save Kuhusu Kanisa to publish."
                    : form.aboutImageUrl
                      ? "Current image loaded."
                      : "Pakia picha ya kuhusu kanisa."}
              </span>
            </label>
          </div>

          {(aboutPendingImagePreview || form.aboutImageUrl) ? (
            <div className="mt-3 overflow-hidden rounded-md border border-white/20 bg-slate-900/50">
              <img
                src={aboutPendingImagePreview || form.aboutImageUrl}
                alt="About church preview"
                className="h-44 w-full object-cover md:h-56"
              />
            </div>
          ) : null}
        </div>
        ) : null}

        {activeTab === "library" ? (
        <div className="mt-4 rounded-md bg-[#08133c]/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Maktaba (PDF)</h3>
              <p className="text-xs text-slate-300">
                Orodha ya PDF za kanisa. Desktop ina table, mobile ina cards.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-primary px-3 py-2"
              onClick={openAddLibraryDialog}
            >
              + Add PDF
            </button>
          </div>

          {libraryItems.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-white/20 p-3 text-xs text-slate-300">
              Hakuna PDF bado. Bonyeza Add PDF kuanza.
            </div>
          ) : (
            <>
              <div className="mt-3 hidden overflow-x-auto rounded-md border border-white/10 md:block">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.08em] text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Preview</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Uploaded</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {paginatedLibraryItems.map((item) => (
                      <tr key={item.id} className="border-t border-white/10 align-top">
                        <td className="px-3 py-2">
                          <div className="h-24 w-16 overflow-hidden rounded border border-white/20 bg-slate-900">
                            <iframe
                              title={`${item.title} preview`}
                              src={buildPdfPreviewUrl(item.pdfUrl)}
                              className="h-full w-full border-0 pointer-events-none"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 font-semibold text-white">{item.title}</td>
                        <td className="px-3 py-2 text-slate-300">{item.description || "-"}</td>
                        <td className="px-3 py-2 text-xs text-slate-300">{item.fileName || "PDF file"}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={item.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-white/20 bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => openEditLibraryDialog(item)}
                              className="rounded-md border border-church-300/40 bg-church-600/20 px-2.5 py-1.5 text-xs font-semibold text-church-100 transition hover:bg-church-600/35"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteLibraryPdf(item.id)}
                              className="rounded-md border border-rose-400/50 bg-rose-900/25 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-900/40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid gap-3 md:hidden">
                {paginatedLibraryItems.map((item) => (
                  <article key={item.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div className="overflow-hidden rounded-md border border-white/20 bg-slate-900">
                      <iframe
                        title={`${item.title} mobile preview`}
                        src={buildPdfPreviewUrl(item.pdfUrl)}
                        className="h-48 w-full border-0 pointer-events-none"
                      />
                    </div>
                    <h4 className="mt-3 text-base font-bold text-white">{item.title}</h4>
                    <p className="mt-1 text-sm text-slate-300">{item.description || "-"}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.fileName || "PDF file"}</p>
                    <p className="text-xs text-slate-400">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-white/20 bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditLibraryDialog(item)}
                        className="rounded-md border border-church-300/40 bg-church-600/20 px-2.5 py-1.5 text-xs font-semibold text-church-100 transition hover:bg-church-600/35"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteLibraryPdf(item.id)}
                        className="rounded-md border border-rose-400/50 bg-rose-900/25 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-900/40"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <p className="text-xs text-slate-400">
                  Showing {libraryStartIndex + 1}-{libraryEndIndex} of {libraryItems.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="admin-btn-ghost px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setLibraryPage((prev) => Math.max(1, prev - 1))}
                    disabled={libraryPage === 1}
                  >
                    Previous
                  </button>
                  <p className="text-xs font-semibold text-slate-300">
                    Page {libraryPage} / {totalLibraryPages}
                  </p>
                  <button
                    type="button"
                    className="admin-btn-ghost px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setLibraryPage((prev) => Math.min(totalLibraryPages, prev + 1))}
                    disabled={libraryPage === totalLibraryPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {libraryDialogOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/75"
                onClick={closeLibraryDialog}
                aria-label="close library dialog"
              />
              <div className="relative z-10 w-full max-w-2xl rounded-md border border-white/15 bg-[#08133c] p-4 shadow-2xl">
                <h4 className="text-lg font-bold text-white">
                  {libraryDialogMode === "add" ? "Add PDF" : "Edit PDF"}
                </h4>
                <p className="text-xs text-slate-300">
                  {libraryDialogMode === "add"
                    ? "Jaza taarifa za PDF mpya."
                    : "Hariri title/description na badili PDF ukitaka."}
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold">
                    PDF Title
                    <input
                      className="form-input"
                      value={libraryFormTitle}
                      onChange={(e) => setLibraryFormTitle(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    PDF Description
                    <input
                      className="form-input"
                      value={libraryFormDescription}
                      onChange={(e) => setLibraryFormDescription(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                    {libraryDialogMode === "add" ? "Upload PDF" : "Replace PDF (optional)"}
                    <input
                      className="form-input"
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => setLibraryFormFile(event.target.files?.[0] || null)}
                    />
                    {libraryFormFile ? (
                      <span className="text-xs text-slate-300">{libraryFormFile.name}</span>
                    ) : null}
                    {libraryDialogMode === "edit" && editingLibraryItem ? (
                      <a
                        href={editingLibraryItem.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-church-200 underline"
                      >
                        Current file: {editingLibraryItem.fileName || "Open PDF"}
                      </a>
                    ) : null}
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="admin-btn-ghost px-3 py-2"
                    onClick={closeLibraryDialog}
                    disabled={isSavingLibraryAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary px-3 py-2"
                    onClick={() => void submitLibraryDialog()}
                    disabled={isSavingLibraryAction}
                  >
                    {isSavingLibraryAction ? "Saving..." : libraryDialogMode === "add" ? "Add PDF" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        ) : null}

        {activeTab === "links" ? (
        <div className="mt-4 rounded-md bg-[#08133c]/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Topbar / Footer Quick Links</h3>
              <p className="text-xs text-slate-300">
                Links hizi zinaonekana kwenye footer na zinaweza kufanana na topbar menu.
              </p>
            </div>
            <button type="button" className="admin-btn-ghost px-3 py-2" onClick={addQuickLink}>
              + Add Link
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {quickLinks.map((link, index) => (
              <div key={link.id} className="grid gap-2 rounded-md bg-white/[0.03] p-2 md:grid-cols-[1fr_1.4fr_auto]">
                <input
                  className="form-input"
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => handleQuickLinkInput(index, "label", e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="Href (mf. /idara au /#mawasiliano)"
                  value={link.href}
                  onChange={(e) => handleQuickLinkInput(index, "href", e.target.value)}
                />
                <button
                  type="button"
                  className="admin-btn-danger px-3 py-2"
                  onClick={() => removeQuickLink(index)}
                  disabled={quickLinks.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        ) : null}

        {activeTab === "seo" ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            SEO Title
            <input
              className="form-input"
              value={form.seoTitle}
              onChange={(e) => handleInput("seoTitle", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            SEO Description
            <textarea
              rows={2}
              className="form-input"
              value={form.seoDescription}
              onChange={(e) => handleInput("seoDescription", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            SEO Keywords
            <input
              className="form-input"
              value={form.seoKeywords}
              onChange={(e) => handleInput("seoKeywords", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Footer Text
            <input
              className="form-input"
              value={form.footerText}
              onChange={(e) => handleInput("footerText", e.target.value)}
            />
          </label>
        </div>
        ) : null}

        {activeTab === "branding" || activeTab === "seo" ? (
        <div className="mt-4 rounded-md bg-[#08133c]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-church-300">
            Live Preview
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">{sitePreview.title || "Website Title"}</h3>
          <p className="text-sm text-slate-300">
            {sitePreview.description || "SEO description preview."}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1 text-xs text-slate-200">
            Theme Color
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/30"
              style={{ backgroundColor: sitePreview.color }}
            />
            {sitePreview.color}
          </div>
        </div>
        ) : null}
          {activeTab !== "library" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="admin-btn-primary"
              type="button"
              onClick={() => {
                if (activeTab === "branding") {
                  void handleSaveBranding();
                  return;
                }
                if (activeTab === "contacts") {
                  void handleSaveContacts();
                  return;
                }
                if (activeTab === "map") {
                  void handleSaveMap();
                  return;
                }
                if (activeTab === "about") {
                  void handleSaveAbout();
                  return;
                }
                if (activeTab === "links") {
                  void handleSaveQuickLinks();
                  return;
                }
                if (activeTab === "seo") {
                  void handleSaveSeoFooter();
                }
              }}
              disabled={savingSection === activeTab}
            >
              {savingSection === activeTab
                ? "Saving..."
                : activeTab === "branding"
                  ? "Save Branding"
                  : activeTab === "contacts"
                    ? "Save Contacts"
                    : activeTab === "map"
                      ? "Save Ramani"
                      : activeTab === "about"
                        ? "Save Kuhusu Kanisa"
                        : activeTab === "links"
                            ? "Save Quick Links"
                            : "Save SEO & Footer"}
            </button>
            <button className="admin-btn-ghost" type="button" onClick={() => void handleReload()}>
              Reload Data
            </button>
          </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

