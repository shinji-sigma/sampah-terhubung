import json
import urllib.request
import os
import sys

token_path = os.path.join(os.environ.get("LOCALAPPDATA", ""), "hermes", "google_token.json")
if not os.path.exists(token_path):
    print("Token not found at", token_path)
    sys.exit(1)

with open(token_path, "r", encoding="utf-8") as f:
    token = json.load(f)["token"]

# 1. Create Google Form
url = "https://forms.googleapis.com/v1/forms"
body = {
    "info": {
        "title": "Evaluasi Kegunaan (System Usability Scale) — Sampah Terhubung",
        "documentTitle": "Evaluasi SUS — Sampah Terhubung"
    }
}
req = urllib.request.Request(
    url,
    data=json.dumps(body).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)

with urllib.request.urlopen(req) as resp:
    form_data = json.loads(resp.read().decode("utf-8"))

form_id = form_data["formId"]
responder_uri = form_data["responderUri"]
print("Created Form ID:", form_id)

description = (
    "Studi Akademik · Evaluasi Prototipe Sistem Koordinasi Lingkungan\n\n"
    "Terima kasih telah meluangkan waktu mencoba prototipe Sampah Terhubung:\n"
    "🌐 https://sampah-terhubung-langgamramadhan9-3266.vercel.app/\n\n"
    "Kuesioner ini mengukur tingkat kebergunaan (usability) sistem menggunakan metode baku "
    "System Usability Scale (SUS) dari John Brooke (1996).\n\n"
    "Ketentuan & Privasi:\n"
    "• Partisipasi bersifat sukarela dan anonim. Tidak ada data pribadi (nama, no HP, alamat rumah) yang dikumpulkan.\n"
    "• Berikan penilaian murni berdasarkan pengalaman Anda, termasuk jika Anda mengalami kendala atau gagal menyelesaikan tugas.\n"
    "• Estimasi waktu pengisian: 3 - 5 menit."
)

sus_items = [
    "1. Saya rasa saya ingin sering menggunakan aplikasi Sampah Terhubung ini.",
    "2. Saya mendapati aplikasi ini rumit secara tidak perlu.",
    "3. Saya rasa aplikasi ini mudah untuk digunakan.",
    "4. Saya rasa saya membutuhkan bantuan orang teknis untuk dapat menggunakan sistem ini.",
    "5. Saya melihat fungsi-fungsi dalam sistem ini terintegrasi dengan baik.",
    "6. Saya merasa ada terlalu banyak ketidakkonsistenan pada sistem ini.",
    "7. Saya memperkirakan sebagian besar orang akan belajar menggunakan sistem ini dengan sangat cepat.",
    "8. Saya mendapati sistem ini sangat merepotkan untuk digunakan.",
    "9. Saya merasa sangat percaya diri saat menggunakan aplikasi ini.",
    "10. Saya harus mempelajari banyak hal sebelum dapat mulai menggunakan sistem ini."
]

task_options = [
    {"value": "Berhasil mandiri tanpa kendala"},
    {"value": "Berhasil setelah mencari-cari / butuh petunjuk"},
    {"value": "Tidak berhasil / mengalami kendala"},
    {"value": "Tidak sempat mencoba"}
]

requests = [
    {
        "updateFormInfo": {
            "info": {
                "description": description
            },
            "updateMask": "description"
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Persetujuan Partisipasi & Usia",
                "description": "Penelitian ini diperuntukkan bagi responden berusia 18 tahun atau lebih secara sukarela.",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": [
                                {"value": "Saya berusia 18 tahun atau lebih dan bersedia berpartisipasi secara sukarela"}
                            ]
                        }
                    }
                }
            },
            "location": {"index": 0}
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Perangkat yang digunakan saat mencoba aplikasi:",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": [
                                {"value": "Ponsel Pintar (Smartphone)"},
                                {"value": "Laptop / Komputer Desktop"},
                                {"value": "Tablet"},
                                {"value": "Lainnya"}
                            ]
                        }
                    }
                }
            },
            "location": {"index": 1}
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Kode Peserta (Opsional):",
                "description": "Jika Anda menekan tombol persetujuan di halaman web /uji-pengguna, masukkan kode acak (misal: P-XXXXXXXX). Kosongkan jika mencoba langsung.",
                "questionItem": {
                    "question": {
                        "required": False,
                        "textQuestion": {"paragraph": False}
                    }
                }
            },
            "location": {"index": 2}
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Tugas 1: Memeriksa jadwal pengangkutan di wilayah Anda",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": task_options
                        }
                    }
                }
            },
            "location": {"index": 3}
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Tugas 2: Mengirim laporan simulasi sampah dengan bukti pendukung",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": task_options
                        }
                    }
                }
            },
            "location": {"index": 4}
        }
    },
    {
        "createItem": {
            "item": {
                "title": "Tugas 3: Memeriksa daftar laporan dan status penanganan",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": task_options
                        }
                    }
                }
            },
            "location": {"index": 5}
        }
    }
]

# Add 10 SUS scale questions
for idx, q_text in enumerate(sus_items):
    requests.append({
        "createItem": {
            "item": {
                "title": q_text,
                "questionItem": {
                    "question": {
                        "required": True,
                        "scaleQuestion": {
                            "low": 1,
                            "high": 5,
                            "lowLabel": "Sangat Tidak Setuju",
                            "highLabel": "Sangat Setuju"
                        }
                    }
                }
            },
            "location": {"index": 6 + idx}
        }
    })

# Add feedback item
requests.append({
    "createItem": {
        "item": {
            "title": "Kritik, Kendala, atau Saran untuk Aplikasi (Opsional):",
            "description": "Tuliskan kendala apa pun yang Anda temui saat mencoba, atau saran fitur.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": True}
                }
            }
        },
        "location": {"index": 16}
    }
})

batch_url = f"https://forms.googleapis.com/v1/forms/{form_id}:batchUpdate"
batch_req = urllib.request.Request(
    batch_url,
    data=json.dumps({"requests": requests}).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)

with urllib.request.urlopen(batch_req) as b_resp:
    print("Batch Update Status:", b_resp.status)

get_req = urllib.request.Request(
    f"https://forms.googleapis.com/v1/forms/{form_id}",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(get_req) as g_resp:
    final_form = json.loads(g_resp.read().decode("utf-8"))
    print("SUCCESS")
    print("TOTAL_ITEMS:", len(final_form.get("items", [])))
    print("RESPONDER_URI:", final_form.get("responderUri"))
    print("EDIT_URI:", f"https://docs.google.com/forms/d/{form_id}/edit")
