import os
import re
import glob
import time
from deep_translator import GoogleTranslator

# Initialize the translator
translator = GoogleTranslator(source='en', target='fr')

# Title Maps for Component MDX Files
TITLE_MAP = {
    "AbsoluteCenter": "AbsoluteCenter Centrage Absolu",
    "Alert": "Alert Alerte",
    "Anchor": "Anchor Ancre",
    "Avatar": "Avatar Avatar",
    "Badge": "Badge Badge",
    "Breadcrumb": "Breadcrumb Fil d'Ariane",
    "Button": "Button Bouton",
    "Card": "Card Carte",
    "Carousel": "Carousel Carrousel",
    "Checkbox": "Checkbox Case à Cocher",
    "Clipboard": "Clipboard Presse-papiers",
    "Code": "Code Code",
    "Collapsible": "Collapsible Pliable",
    "ColorPicker": "ColorPicker Sélecteur de Couleur",
    "Combobox": "Combobox Boîte Combinée",
    "DatePicker": "DatePicker Sélecteur de Date",
    "Dialog": "Dialog Dialogue",
    "Drawer": "Drawer Tiroir",
    "Dropdown": "Dropdown Menu Déroulant",
    "Editable": "Editable Modifiable",
    "Field": "Field Champ",
    "Fieldset": "Fieldset Ensemble de Champs",
    "FileUpload": "FileUpload Téléchargement de Fichier",
    "Grid": "Grid Grille",
    "Group": "Group Groupe",
    "Heading": "Heading Titre",
    "HoverCard": "HoverCard Carte de Survol",
    "Icon": "Icon Icône",
    "Layout": "Layout Mise en Page",
    "Loader": "Loader Chargeur",
    "PaginatedTable": "PaginatedTable Tableau Paginé",
    "Pagination": "Pagination Pagination",
    "PinField": "PinField Champ de Code PIN",
    "Popover": "Popover Popover",
    "Progress": "Progress Barre de Progression",
    "RadioCardGroup": "RadioCardGroup Groupe de Cartes Radio",
    "RadioGroup": "RadioGroup Groupe de Boutons Radio",
    "Search": "Search Recherche",
    "SegmentGroup": "SegmentGroup Groupe de Segments",
    "Select": "Select Sélection",
    "Skeleton": "Skeleton Squelette",
    "Slider": "Slider Curseur",
    "Spinner": "Spinner Indicateur de Chargement",
    "Splitter": "Splitter Diviseur",
    "Stack": "Stack Pile",
    "Switch": "Switch Commutateur",
    "Table": "Table Tableau",
    "Tabs": "Tabs Onglets",
    "TagsField": "TagsField Champ de Tags",
    "Text": "Text Texte",
    "Textarea": "Textarea Zone de Texte",
    "Toast": "Toast Toast",
    "ToggleGroup": "ToggleGroup Groupe de Boutons Bascules",
    "Tooltip": "Tooltip Infobulle"
}

# Title Maps for Doc MD Files
DOCS_TITLE_MAP = {
    "Architecture": "Architecture",
    "Hydration": "Hydratation",
    "CMS Page Builder": "Constructeur de pages CMS"
}

# English-to-French mappings for headings to ensure clean, consistent sections
HEADING_MAP = {
    "introduction": "Introduction",
    "usage": "Utilisation",
    "cms page builder": "Constructeur de pages CMS",
    "props": "Propriétés",
    "properties": "Propriétés",
    "attributes": "Attributs",
    "hydration": "Hydratation",
    "accessibility": "Accessibilité"
}

# Table headers translation map
HEADER_TRANSLATIONS = {
    "prop": "Propriété",
    "property": "Propriété",
    "type": "Type",
    "default": "Défaut",
    "description": "Description",
    "part": "Partie",
    "interactive": "interactif",
    "hassignal": "aUnSignal",
    "result": "Résultat",
    "meaning": "Signification",
    "component": "Composant",
    "rule": "Règle",
    "trigger": "Déclencheur",
    "status": "Statut",
    "notes": "Remarques",
    "notes (already fixed)": "Remarques (déjà corrigées)",
    "notes / warnings": "Remarques / Avertissements",
    "behaviour signal": "Signal de comportement"
}

def translate_text(text):
    text_stripped = text.strip()
    if not text_stripped:
        return text
    # Keep pure code snippets or simple values as-is
    if (text_stripped.startswith('`') and text_stripped.endswith('`') and text_stripped.count('`') == 2) or text_stripped.isdigit() or len(text_stripped) <= 1:
        return text

    # Try translating
    for _ in range(3):
        try:
            val = translator.translate(text_stripped)
            if val:
                # Keep original leading/trailing spaces
                leading = text[:len(text) - len(text.lstrip())]
                trailing = text[len(text.rstrip()):]
                return leading + val + trailing
        except Exception as e:
            print(f"Error translating '{text_stripped[:40]}...': {e}. Retrying in 1s...")
            time.sleep(1)
    return text

def translate_line(line):
    # Strip list markers and blockquotes, translate the rest, and restore them
    match = re.match(r'^(\s*[-*+]\s+)(.*)$', line)
    if match:
        marker, content = match.groups()
        return marker + translate_text(content)
    match = re.match(r'^(\s*\d+\.\s+)(.*)$', line)
    if match:
        marker, content = match.groups()
        return marker + translate_text(content)
    match = re.match(r'^(\s*>\s*)(.*)$', line)
    if match:
        marker, content = match.groups()
        return marker + translate_text(content)
    return translate_text(line)

def translate_file(src_path, dest_path, title_map):
    print(f"Translating {src_path} -> {dest_path}...")
    with open(src_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    out_lines = []
    in_frontmatter = False
    in_code_block = False
    in_demo_preview = False
    current_headers = []
    seen_first_line = False

    for line_idx, line in enumerate(lines):
        stripped = line.strip()

        # Handle frontmatter block
        if not seen_first_line and stripped == "---":
            in_frontmatter = True
            seen_first_line = True
            out_lines.append(line)
            continue
        elif in_frontmatter and stripped == "---":
            in_frontmatter = False
            out_lines.append(line)
            continue

        if in_frontmatter:
            if stripped.startswith("title:"):
                # Parse title
                title_val = line.split("title:", 1)[1].strip()
                # Lookup or translate
                translated_title = title_map.get(title_val, title_val)
                out_lines.append(f"title: {translated_title}\n")
            else:
                out_lines.append(line)
            continue

        # Handle code blocks
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            out_lines.append(line)
            continue

        if in_code_block:
            out_lines.append(line)
            continue

        # Handle DemoPreview blocks
        if stripped.startswith("<DemoPreview"):
            in_demo_preview = True
            out_lines.append(line)
            continue
        elif in_demo_preview and stripped.startswith("</DemoPreview>"):
            in_demo_preview = False
            out_lines.append(line)
            continue

        if in_demo_preview:
            out_lines.append(line)
            continue

        # Handle imports and adjust paths for nested directory
        if stripped.startswith("import "):
            if "../../app/" in line:
                line = line.replace("../../app/", "../../../app/")
            elif "../components/ui" in line:
                line = line.replace("../components/ui", "../../components/ui")
            elif "../design-system/" in line:
                line = line.replace("../design-system/", "../../design-system/")
            out_lines.append(line)
            continue

        # Handle tables
        if stripped.startswith("|") and stripped.endswith("|"):
            cols = [c for c in line.split("|")] # Split row, keeping spaces
            # Check if it is a separator line (e.g. | --- | --- |)
            if all(re.match(r'^\s*-*\s*$', col) for col in cols[1:-1]):
                out_lines.append(line)
                continue

            # Determine if it's a header line
            is_header = any(col.strip().lower() in ["prop", "property", "type", "description", "part", "meaning", "result", "hassignal", "interactive"] for col in cols[1:-1])
            if is_header:
                current_headers = [col.strip() for col in cols[1:-1]]
                # Translate headers
                translated_cols = []
                for col in cols[1:-1]:
                    c_stripped = col.strip()
                    c_translated = HEADER_TRANSLATIONS.get(c_stripped.lower(), c_stripped)
                    translated_cols.append(col.replace(c_stripped, c_translated))
                # Rebuild header line
                new_line = "|" + "|".join(translated_cols) + "|\n"
                out_lines.append(new_line)
                continue

            # It's a data line
            translated_cols = []
            for idx, col in enumerate(cols[1:-1]):
                c_stripped = col.strip()
                should_translate_col = False
                if idx < len(current_headers):
                    header = current_headers[idx].lower()
                    if any(x in header for x in ["description", "meaning", "notes", "trigger", "behaviour signal", "remarques", "signal de comportement", "déclencheur"]):
                        should_translate_col = True

                if should_translate_col:
                    c_translated = translate_text(c_stripped)
                    translated_cols.append(col.replace(c_stripped, c_translated))
                else:
                    translated_cols.append(col)

            new_line = "|" + "|".join(translated_cols) + "|\n"
            out_lines.append(new_line)
            continue

        # Handle headings
        match_heading = re.match(r'^(#+)\s+(.*)$', stripped)
        if match_heading:
            level, text = match_heading.groups()
            text_stripped = text.strip()
            translated_heading = HEADING_MAP.get(text_stripped.lower(), None)
            if not translated_heading:
                translated_heading = translate_text(text_stripped)
            out_lines.append(f"{level} {translated_heading}\n")
            continue

        # Normal text line (paragraph, list, etc.)
        if stripped:
            out_lines.append(translate_line(line))
        else:
            out_lines.append(line)

    with open(dest_path, "w", encoding="utf-8") as f:
        f.writelines(out_lines)

def main():
    os.makedirs("content/docs/fr", exist_ok=True)
    os.makedirs("content/components/fr", exist_ok=True)

    # Translate docs
    doc_files = glob.glob("content/docs/*.md")
    for f in doc_files:
        base = os.path.basename(f)
        dest = os.path.join("content/docs/fr", base)
        translate_file(f, dest, DOCS_TITLE_MAP)

    # Translate components
    comp_files = glob.glob("content/components/*.mdx")
    for f in comp_files:
        base = os.path.basename(f)
        dest = os.path.join("content/components/fr", base)
        translate_file(f, dest, TITLE_MAP)

    print("Translation completed successfully!")

if __name__ == "__main__":
    main()
