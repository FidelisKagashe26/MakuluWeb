import mongoose, { Schema } from "mongoose";

const quickLinkSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    href: { type: String, required: true }
  },
  { _id: false }
);

const carouselSlideSchema = new Schema(
  {
    id: { type: String, required: true },
    imageUrl: { type: String, required: true },
    badge: { type: String, default: "" },
    title: { type: String, required: true },
    scripture: { type: String, default: "" },
    description: { type: String, default: "" },
    primaryLabel: { type: String, default: "" },
    primaryHref: { type: String, default: "" },
    secondaryLabel: { type: String, default: "" },
    secondaryHref: { type: String, default: "" },
    brightness: { type: String, default: "dark" }
  },
  { _id: false }
);

const scriptureCardSchema = new Schema(
  {
    id: { type: String, required: true },
    reference: { type: String, default: "" },
    content: { type: String, default: "" }
  },
  { _id: false }
);

const libraryItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    uploadedAt: { type: String, default: "" }
  },
  { _id: false }
);

const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    churchName: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    themeColor: { type: String, default: "#2543e2" },
    heroCarousel: { type: [carouselSlideSchema], default: [] },
    missionSection: {
      sectionTitle: { type: String, default: "" },
      statementTitle: { type: String, default: "" },
      statementQuote: { type: String, default: "" },
      scriptureCards: { type: [scriptureCardSchema], default: [] },
      imageUrl: { type: String, default: "" },
      imageAlt: { type: String, default: "" },
      learnMoreImageUrl: { type: String, default: "" },
      learnMoreImageAlt: { type: String, default: "" },
      learnMoreHref: { type: String, default: "" }
    },
    mapLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      zoom: { type: Number, default: 15 },
      label: { type: String, default: "" }
    },
    aboutChurch: {
      title: { type: String, default: "" },
      content: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      imageAlt: { type: String, default: "" }
    },
    contactInfo: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" }
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
      instagram: { type: String, default: "" },
      whatsapp: { type: String, default: "" }
    },
    quickLinks: { type: [quickLinkSchema], default: [] },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: { type: String, default: "" }
    },
    libraryItems: { type: [libraryItemSchema], default: [] },
    faviconUrl: { type: String, default: "" },
    footerText: { type: String, default: "" }
  },
  {
    collection: "site_settings",
    versionKey: false
  }
);

export const SiteSettingsDbModel: any =
  mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);

