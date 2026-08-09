"use client";

import { useState, type FormEvent } from "react";
import type { DeliveryLocation } from "@/types/location";
import { useGeocode } from "@/hooks/useGeocode";
import Modal from "@/components/Modal/Modal";
import styles from "./AddressForm.module.scss";

interface AddressFormProps {
  onSave: (location: DeliveryLocation) => void;
  triggerLabel?: string;
  modalTitle?: string;
}

export default function AddressForm({
  onSave,
  triggerLabel = "+ Adresse hinzufügen",
  modalTitle = "Adresse hinzufügen",
}: AddressFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const { geocode, isLoading, error, setError } = useGeocode();

  function resetAndClose() {
    setName("");
    setStreet("");
    setHouseNumber("");
    setPostalCode("");
    setCity("");
    setOpeningHours("");
    setError(null);
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    if (!trimmedStreet || !trimmedCity) return;

    // Nominatim reads best as "<street> <number>, <postcode> <city>" - and
    // that's also exactly the clean format we want to display, so build it
    // once and use it both for the lookup and as the stored address (rather
    // than Nominatim's verbose reverse-geocoded display_name).
    const formattedAddress = [
      [trimmedStreet, houseNumber.trim()].filter(Boolean).join(" "),
      [postalCode.trim(), trimmedCity].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");

    const result = await geocode(formattedAddress);
    if (!result) return;

    onSave({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      address: formattedAddress,
      label: name.trim() || undefined,
      openingHours: openingHours.trim() || undefined,
      lat: result.lat,
      lng: result.lng,
      createdAt: Date.now(),
    });

    resetAndClose();
  }

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </button>

      {isOpen && (
        <Modal title={modalTitle} onClose={resetAndClose}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Kunde Müller"
                disabled={isLoading}
              />
            </label>

            <div className={styles.row}>
              <label className={`${styles.field} ${styles.grow}`}>
                <span>Straße</span>
                <input
                  type="text"
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
                  placeholder="z. B. Stephansplatz"
                  disabled={isLoading}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Nr.</span>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(event) => setHouseNumber(event.target.value)}
                  placeholder="1"
                  disabled={isLoading}
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>PLZ</span>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  placeholder="1010"
                  disabled={isLoading}
                />
              </label>

              <label className={`${styles.field} ${styles.grow}`}>
                <span>Ort</span>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Wien"
                  disabled={isLoading}
                  required
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Öffnungszeiten (optional)</span>
              <input
                type="text"
                value={openingHours}
                onChange={(event) => setOpeningHours(event.target.value)}
                placeholder="z. B. Mo–Fr 08:00–18:00, Sa 09:00–13:00"
                disabled={isLoading}
              />
            </label>

            <button type="submit" className={styles.submit} disabled={isLoading}>
              {isLoading ? "Suche…" : "Speichern"}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        </Modal>
      )}
    </>
  );
}
