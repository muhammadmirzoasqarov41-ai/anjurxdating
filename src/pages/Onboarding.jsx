import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Plus, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { saveProfile } from "../lib/firestore";
import {
  uploadProfilePhotos,
  validateImageFile,
  MAX_PHOTO_COUNT,
  MIN_PHOTO_COUNT,
} from "../lib/storage";

export default function Onboarding() {
  const { user, refreshProfile } = useAuthStore();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);

  // Clean up object URLs when component unmounts or photos change
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
    };
  }, [photos]);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setPhotoError("");

    const availableSlots = MAX_PHOTO_COUNT - photos.length;
    if (availableSlots <= 0) {
      setPhotoError("Ko‘pi bilan 6 ta rasm yuklash mumkin.");
      e.target.value = "";
      return;
    }

    let filesToProcess = files;
    if (files.length > availableSlots) {
      setPhotoError("Ko‘pi bilan 6 ta rasm yuklash mumkin. Faqat dastlabki rasm(lar) tanlandi.");
      filesToProcess = files.slice(0, availableSlots);
    }

    const newItems = [];
    for (const file of filesToProcess) {
      const errorMsg = validateImageFile(file);
      if (errorMsg) {
        setPhotoError(errorMsg);
        continue;
      }

      // Prevent duplicate selection by filename and size
      const isDuplicate = photos.some(
        (p) => p.file.name === file.name && p.file.size === file.size
      );
      if (isDuplicate) {
        continue;
      }

      newItems.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (newItems.length > 0) {
      setPhotos((prev) => [...prev, ...newItems]);
    }

    // Reset input so user can choose the same file if re-added
    e.target.value = "";
  }

  function handleRemovePhoto(indexToRemove) {
    setPhotos((prev) => {
      const item = prev[indexToRemove];
      if (item && item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setPhotoError("Kamida 1 ta rasm yuklang");
      } else {
        setPhotoError("");
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (photos.length < MIN_PHOTO_COUNT) {
      setPhotoError("Kamida 1 ta rasm yuklang");
      return;
    }
    if (photos.length > MAX_PHOTO_COUNT) {
      setPhotoError("Ko‘pi bilan 6 ta rasm yuklash mumkin.");
      return;
    }

    setBusy(true);
    setPhotoError("");
    setUploadProgress("Rasm siqilmoqda va tayyorlanmoqda...");

    try {
      // 1. High-speed compressed upload to Firebase Storage with timeout fallback
      const uploadedUrls = await uploadProfilePhotos(
        user.uid,
        photos,
        (current, total) => {
          setUploadProgress(`Rasm yuklanmoqda (${current}/${total})...`);
        }
      );

      // 2. Save profile in Firestore
      setUploadProgress("Profil saqlanmoqda...");
      await saveProfile(user.uid, {
        displayName: displayName.trim() || "Foydalanuvchi",
        age: age ? Number(age) : null,
        job: job.trim() || null,
        bio: bio.trim() || null,
        photos: uploadedUrls.length > 0 ? uploadedUrls : photos.map((p) => p.preview).filter(Boolean),
        city: "Toshkent",
        datingIntention: "Do'stlik va muloqot",
        interests: ["Qahva", "Kino", "Musiqa"],
        distanceKm: Math.floor(Math.random() * 12) + 2,
        isBot: false,
      });

      await refreshProfile();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Profilni saqlashda xatolik:", err);
      setPhotoError("Profilni saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="text-flame-start" size={26} fill="currentColor" />
          <h1 className="font-extrabold text-xl">Profilingizni to'ldiring</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Boshqalar sizni o'z lentasida ko'rganlarida shunday ko'rinadi.
        </p>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Foto yuklash qismi (1-6 ta rasm) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Rasmlar
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {photos.length}/{MAX_PHOTO_COUNT}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: MAX_PHOTO_COUNT }).map((_, idx) => {
                  const item = photos[idx];
                  if (item) {
                    return (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"
                      >
                        <img
                          src={item.preview}
                          alt={`Rasm ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium px-1.5 py-0.5 rounded">
                            Asosiy
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Rasmni o‘chirish"
                          aria-label="Rasmni o‘chirish"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }

                  if (idx === photos.length) {
                    return (
                      <button
                        key={`add-${idx}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-flame-start bg-gray-50 hover:bg-rose-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-flame-start transition-all cursor-pointer"
                        title="Rasm qo‘shish"
                      >
                        <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-flame-start">
                          <Plus size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-semibold">Rasm qo‘shish</span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square rounded-xl border border-gray-200/60 bg-gray-50/60 flex items-center justify-center text-gray-300 text-xs font-medium"
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {photoError ? (
                <p className="text-nope text-xs font-medium mt-2">{photoError}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  Kamida 1 ta, ko‘pi bilan 6 ta rasm (JPG, PNG, WEBP, maksimal 10 MB)
                </p>
              )}
            </div>

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
              className="w-full py-3 rounded-full flame-bg text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{uploadProgress || "Rasmlar yuklanmoqda..."}</span>
                </>
              ) : (
                "Surishni boshlash"
              )}
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
