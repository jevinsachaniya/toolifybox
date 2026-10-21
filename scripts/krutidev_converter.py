# -*- coding: utf-8 -*-
"""
KrutiDev 010 / DevLys 010 to Unicode Devanagari Converter
=========================================================
Converts legacy KrutiDev / DevLys ASCII text into clean Unicode Hindi.
"""

import re
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def krutidev_to_unicode(text):
    if not text:
        return ""

    modified_text = text

    # Replacement rules in order
    rules = [
        # Special symbols & numbers
        ("'", "‘"),
        ("\"", "’"),
        ("ó", "द्ध"),
        ("ò", "द्द"),
        ("ñ", "ह्न"),
        ("ô", "ह्य"),
        ("õ", "हृ"),
        ("º", "०"),
        ("±", "१"),
        ("²", "२"),
        ("³", "३"),
        ("´", "४"),
        ("µ", "५"),
        ("¶", "६"),
        ("·", "७"),
        ("¸", "८"),
        ("¹", "९"),
        ("×", "।"),
        ("A", "।"),

        # Matras & vowels
        ("kS", "ौ"),
        ("ks", "ो"),
        ("vkS", "औ"),
        ("vk", "आ"),
        ("v", "अ"),
        ("bZ", "ई"),
        ("b", "इ"),
        ("m", "उ"),
        ("Å", "ऊ"),
        ("ऋ", "ऋ"),
        ("s", "े"),
        ("S", "ै"),
        ("k", "ा"),
        ("h", "ी"),
        ("q", "ु"),
        ("w", "ू"),
        ("`", "ृ"),
        ("a", "ं"),
        ("W", "ँ"),
        (":", "ः"),

        # Consonants
        ("d", "क"),
        ("D", "क्"),
        ("[k", "ख"),
        ("[", "ख्"),
        ("x", "ग"),
        ("X", "ग्"),
        ("?k", "घ"),
        ("?", "घ्"),
        ("p", "च"),
        ("P", "च्"),
        ("N", "छ"),
        ("t", "ज"),
        ("T", "ज्"),
        ("V", "ट"),
        ("B", "ठ"),
        ("M", "ड"),
        ("<", "ढ"),
        (".k", "ण"),
        (".", "ण्"),
        ("r", "त"),
        ("R", "त्"),
        ("Fk", "थ"),
        ("F", "थ्"),
        ("n", "द"),
        ("/k", "ध"),
        ("/", "ध्"),
        ("u", "न"),
        ("U", "न्"),
        ("i", "प"),
        ("I", "प्"),
        ("Q", "फ"),
        ("c", "ब"),
        ("C", "ब्"),
        ("Hk", "भ"),
        ("H", "भ्"),
        ("e", "म"),
        ("E", "म्"),
        (";", "य"),
        ("Y", "य्"),
        ("j", "र"),
        ("y", "ल"),
        ("L", "ल्"),
        ("o", "व"),
        ("O", "व्"),
        ("'", "श"),
        ("\"", "ष्"),
        ("l", "स"),
        ("L", "स्"),
        ("g", "ह"),
        ("{k", "क्ष"),
        ("{", "क्ष्"),
        ("=k", "त्र"),
        ("=", "त्र्"),
        ("K", "ज्ञ"),
        ("z", "्र"),
        ("Z", "्र"),
    ]

    for k, v in rules:
        modified_text = modified_text.replace(k, v)

    # Reorder chhoti 'i' matra (f in KrutiDev comes before the letter)
    # e.g., 'f' + Consonant -> Consonant + 'ि'
    def fix_chhoti_i(match):
        return match.group(1) + "ि"

    # Regex to handle chhoti i followed by single consonant or conjunct
    modified_text = re.sub(r'f([क-ह][्][क-ह]|[क-ह])', fix_chhoti_i, modified_text)

    # Reorder half-r (Z / z)
    modified_text = re.sub(r'([क-ह])Z', r'र्\1', modified_text)

    return modified_text


if __name__ == "__main__":
    test_str = "fdjk;kukek"
    print("Kruti:", test_str, "-> Unicode:", krutidev_to_unicode(test_str))
