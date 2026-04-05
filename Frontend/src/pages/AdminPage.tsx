import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

const loginSchema = z.object({
  email: z.string().email("Weka email sahihi"),
  password: z.string().min(6, "Nenosiri liwe angalau herufi 6")
});

const youtubeSchema = z.object({
  youtubeLink: z
    .string()
    .url("Weka URL sahihi ya YouTube")
    .refine((value) => Boolean(toYouTubeEmbedUrl(value)), "Weka link halali ya YouTube")
});

type LoginForm = z.infer<typeof loginSchema>;
type YoutubeForm = z.infer<typeof youtubeSchema>;

export default function AdminPage() {
  const [embedPreview, setEmbedPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const youtubeForm = useForm<YoutubeForm>({
    resolver: zodResolver(youtubeSchema),
    defaultValues: {
      youtubeLink: "https://www.youtube.com/watch?v=9No-FiEInLA"
    }
  });

  const onSubmit = async (_data: LoginForm) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    toast.success("Mfumo wa login umeandaliwa. Tuunganishe Bolt Auth sasa.");
  };

  const onConvertYoutube = ({ youtubeLink }: YoutubeForm) => {
    const embed = toYouTubeEmbedUrl(youtubeLink);
    if (!embed) {
      toast.error("Link haijulikani kama YouTube video.");
      return;
    }
    setEmbedPreview(embed);
    toast.success("Link imebadilishwa kuwa embed URL.");
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Admin login page kwa usimamizi wa website ya kanisa." />
      </Helmet>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">
            Ingia kusimamia matangazo, idara, viongozi, na taarifa za kanisa.
          </p>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-100 dark:border-slate-700 dark:bg-slate-950"
                type="email"
                placeholder="admin@makulu.org"
                {...register("email")}
              />
              {errors.email ? (
                <small className="text-sm text-rose-700">{errors.email.message}</small>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-100 dark:border-slate-700 dark:bg-slate-950"
                type="password"
                placeholder="******"
                {...register("password")}
              />
              {errors.password ? (
                <small className="text-sm text-rose-700">{errors.password.message}</small>
              ) : null}
            </label>

            <button
              className="mt-1 w-fit rounded-xl bg-church-700 px-4 py-2 font-semibold text-white transition hover:bg-church-800 disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Inaingia..." : "Ingia"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">YouTube Integration</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Admin akiweka YouTube link, mfumo una-convert moja kwa moja kuwa embed URL
            na kuonyesha preview responsive.
          </p>

          <form
            onSubmit={youtubeForm.handleSubmit(onConvertYoutube)}
            className="mt-4 grid gap-3"
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              YouTube Link
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-100 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://www.youtube.com/watch?v=..."
                {...youtubeForm.register("youtubeLink")}
              />
              {youtubeForm.formState.errors.youtubeLink ? (
                <small className="text-sm text-rose-700">
                  {youtubeForm.formState.errors.youtubeLink.message}
                </small>
              ) : null}
            </label>

            <button
              type="submit"
              className="w-fit rounded-xl bg-church-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
            >
              Convert to Embed
            </button>
          </form>

          {embedPreview ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Embed URL
              </p>
              <code className="block overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {embedPreview}
              </code>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <iframe
                  className="aspect-video w-full"
                  src={embedPreview}
                  title="YouTube preview"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
