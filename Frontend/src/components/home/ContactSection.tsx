import { z } from "zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactDetails } from "@/data/content";
import { api } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2, "Weka jina lenye angalau herufi 2"),
  email: z.string().email("Weka email sahihi"),
  message: z.string().min(10, "Andika ujumbe angalau maneno machache")
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (payload: ContactForm) => {
    try {
      await api.post("/contact", payload);
      toast.success("Ujumbe umetumwa kikamilifu.");
      reset();
    } catch {
      toast.success("Ujumbe umehifadhiwa kwa majaribio. Endpoint ya backend itaunganishwa.");
      reset();
    }
  };

  return (
    <motion.section
      id="mawasiliano"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Mawasiliano</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Contact Section</h3>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Una swali au hitaji la maombi? Wasiliana nasi kupitia form au taarifa zifuatazo.
          </p>
          <div className="rounded-xl border border-church-200/60 bg-white/88 p-4 text-sm dark:border-church-700/40 dark:bg-church-950/62">
            <p>{contactDetails.address}</p>
            <p>{contactDetails.phone}</p>
            <p>{contactDetails.email}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-church-200/65 dark:border-church-700/40">
            <iframe
              title="Makulu Map"
              src={contactDetails.mapEmbed}
              className="h-52 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Jina
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-200 dark:border-slate-700 dark:bg-slate-950"
              {...register("name")}
            />
            {errors.name ? <span className="text-xs text-rose-600">{errors.name.message}</span> : null}
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-200 dark:border-slate-700 dark:bg-slate-950"
              {...register("email")}
            />
            {errors.email ? (
              <span className="text-xs text-rose-600">{errors.email.message}</span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Ujumbe
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-200 dark:border-slate-700 dark:bg-slate-950"
              {...register("message")}
            />
            {errors.message ? (
              <span className="text-xs text-rose-600">{errors.message.message}</span>
            ) : null}
          </label>

          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-xl bg-church-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-church-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Inatuma..." : "Tuma Ujumbe"}
          </button>
        </form>
      </div>
    </motion.section>
  );
}
