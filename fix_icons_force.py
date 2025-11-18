import os
import json
import unicodedata

ROOT = os.path.dirname(__file__)
SURV_IMG_DIR = os.path.join(ROOT, "perkroulette", "css", "img", "surv")
KILL_IMG_DIR = os.path.join(ROOT, "perkroulette", "css", "img", "kill")

SURV_JSON = os.path.join(ROOT, "perkroulette", "json", "survivor-perks.json")
KILL_JSON = os.path.join(ROOT, "perkroulette", "json", "killer-perks.json")


def slugify(perk_name: str) -> str:
    # même logique que dans ton JS : toLowerCase + normalize NFD + remove diacritics + remplacements
    s = perk_name.lower()

    # Normalisation Unicode + suppression des diacritiques
    s_norm = unicodedata.normalize("NFD", s)
    s_no_diac = "".join(c for c in s_norm if unicodedata.category(c) != "Mn")

    # Remplacements comme dans le JS
    s_no_diac = s_no_diac.replace(" ", "")
    s_no_diac = s_no_diac.replace("'", "")
    s_no_diac = s_no_diac.replace("-", "")
    s_no_diac = s_no_diac.replace("&", "and")
    s_no_diac = s_no_diac.replace("!", "")
    s_no_diac = s_no_diac.replace(":", "")

    return s_no_diac


def force_rename_folder(img_dir: str, json_path: str, kind: str):
    """
    kind = 'surv' ou 'kill'
    """
    print(f"\n--- Traitement de {img_dir} ({kind}) ---")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    perks = data.get("perks", [])
    expected_files = set()

    files_in_dir = os.listdir(img_dir)

    # Map insensible à la casse → fichier réel
    lower_map = {f.lower(): f for f in files_in_dir}

    for perk in perks:
        name = perk.get("perk_name", "")
        slug = slugify(name)
        expected_fname = f"iconperks-{slug}.png"
        expected_files.add(expected_fname)

        lower_expected = expected_fname.lower()

        if lower_expected not in lower_map:
            print(f"⚠ MANQUE : {name} → {expected_fname} (aucun fichier correspondant trouvé)")
            continue

        current_real_name = lower_map[lower_expected]
        current_path = os.path.join(img_dir, current_real_name)
        target_path = os.path.join(img_dir, expected_fname)

        if current_real_name == expected_fname:
            print(f"OK (déjà bon) : {expected_fname}")
            continue

        # Forcer un vrai renommage en passant par un nom temporaire
        tmp_path = os.path.join(img_dir, "__tmp__" + expected_fname)

        # S'il restait un ancien tmp, on le supprime
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        print(f"RENOMME : {current_real_name}  ->  {expected_fname}")
        os.rename(current_path, tmp_path)
        os.rename(tmp_path, target_path)

    # Nettoyage : supprimer les PNG qui ne correspondent à aucun perk
    print("\n--- Nettoyage des fichiers PNG inutilisés ---")
    for f in os.listdir(img_dir):
        if not f.lower().endswith(".png"):
            continue
        if f.startswith("__tmp__"):
            # sécurité : on vire les éventuels tmp qui traînent
            print(f"SUPPR TMP : {f}")
            os.remove(os.path.join(img_dir, f))
            continue
        if f not in expected_files:
            print(f"SUPPR (inutile) : {f}")
            os.remove(os.path.join(img_dir, f))

    print("Terminé pour", img_dir)


def main():
    force_rename_folder(SURV_IMG_DIR, SURV_JSON, "surv")
    force_rename_folder(KILL_IMG_DIR, KILL_JSON, "kill")
    print("\nTout est terminé. Tu peux maintenant vérifier les fichiers puis commit/push.")


if __name__ == "__main__":
    main()
