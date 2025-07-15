# 🔗 Konfigurasi App Links (Android) & Universal Links (iOS)

Repositori ini digunakan untuk menyimpan dan menyajikan file `.well-known/assetlinks.json` dan `apple-app-site-association`, yang diperlukan untuk mendukung fitur deep linking di aplikasi Android dan iOS.

---

## 📁 Struktur Direktori

/root<domain>
└── /.well-known/
├── assetlinks.json
└── apple-app-site-association

File ini akan diakses melalui:

- **Android**: `https://namadomain.com/.well-known/assetlinks.json`
- **iOS**: `https://namadomain.com/.well-known/apple-app-site-association`

---

## Android – assetlinks.json

### Contoh isi:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "co.id.ajsmsig.cs.simpel",
      "sha256_cert_fingerprints": [
        "12:34:56:78:...:AB:CD:EF"
      ]
    }
  }
]

Penjelasan:
package_name: Nama paket aplikasi Android (lihat di AndroidManifest.xml).

sha256_cert_fingerprints: Sidik jari SHA-256 dari sertifikat signing aplikasi.

Diperoleh dengan perintah:

bash
Copy
Edit
keytool -list -v -keystore nama_keystore.jks -alias nama_alias -storepass password
relation: Untuk App Links harus berisi delegate_permission/common.handle_all_urls.


iOS – apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABCDE12345.co.id.ajsmsig.cs.simpel",
        "paths": [ "/intentdeeplink/*", "/msigdeeplink/*" ]
      }
    ]
  }
}


Penjelasan:
appID: Gabungan dari Apple Developer Team ID dan Bundle Identifier aplikasi iOS, dipisahkan titik (.).
Contoh: ABCDE12345.co.id.ajsmsig.cs.simpel
Team ID bisa dilihat di Apple Developer Portal.
paths: Rute (URL path) yang bisa ditangani oleh aplikasi.
Gunakan * untuk mencakup semua rute dalam path tersebut.
Bisa juga gunakan "NOT /contoh/*" untuk mengecualikan rute tertentu.
```

<!-- DOCKER -->

```bash
docker build -t deeplink-service .
```

```bash
docker run -d -p 3000:3000 --name deeplink-service-container deeplink-service
```

#check log

```bash
docker logs -f deeplink-service-container
```

# check daftar running

```bash
docker ps
```

# stop running

```bash
docker stop deeplink-service-container
```

# penjelasan

-p 3000:3000
Mapping port:
80 = port di host (komputermu)
3000 = port di container
