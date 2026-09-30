import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Camera } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { saveProfile } from "../lib/firestore";

// fotos de ejemplo por si el usuario no quiere pegar una URL propia
const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=800&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80",
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuthStore();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(user?.photoURL || SAMPLE_PHOTOS[0]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveProfile(user.uid, {
        displayName: displayName.trim(),
        age: age ? Number(age) : null,
        job: job.trim() || null,
        bio: bio.trim() || null,
        photos: [photo],
        distanceKm: Math.floor(Math.random() * 15) + 1,
        isBot: false,
      });
      await refreshProfile();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("No se pudo guardar el perfil", err);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="text-flame-start" size={26} fill="currentColor" />
          <h1 className="font-extrabold text-xl">Profilingizni to'ldiring</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Boshqalar sizni o'z lentasida ko'rganlarida shunday ko'rinadi.
        </p>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          {/* preview de la foto */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 mb-3">
              <img src={photo} alt="Suratingiz" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              {SAMPLE_PHOTOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhoto(p)}
                  className={
                    "w-10 h-10 rounded-full overflow-hidden border-2 " +
                    (photo === p ? "border-flame-start" : "border-transparent")
                  }
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Ism">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="input"
                placeholder="Ismingiz nima?"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Yosh">
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  className="input"
                  placeholder="25"
                />
              </Field>
              <Field label="Kasb / Mashg'ulot">
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="input"
                  placeholder="Dizayner"
                />
              </Field>
            </div>

            <Field label="Surat (URL)">
              <div className="relative">
                <Camera
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="url"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="input pl-9"
                  placeholder="https://..."
                />
              </div>
            </Field>

            <Field label="O'zingiz haqingizda">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                className="input resize-none"
                placeholder="O'zingiz haqingizda biror narsa yozing"
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-full flame-bg text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Saqlanmoqda..." : "Surishni boshlash"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.9rem;
          border-radius: 0.75rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          outline: none;
          font-size: 0.9rem;
        }
        .input:focus { border-color: #fd5068; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
