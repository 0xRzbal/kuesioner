# Deployment artifact

`kuesioner-v3-deploy.zip` is the exact prebuilt deployment bundle used for the live site. It contains the browser assets and the Node HTTP server bundle. The editable application source remains in the repository root (`src/` and `server/`).

`kuesioner-v3-deploy-rombak.zip` is the revised visual deployment bundle. It uses the same Node server/package as v3 and replaces only the built client assets on the live service.

`kuesioner-v4-deploy.zip` is the v4 deployment bundle. It includes the built client assets, Node server bundle, and package metadata; deploy it using the existing `kuesioner.service` and reverse proxy.

`kuesioner-v4-deploy-peneliti.zip` is the v4 deployment bundle with peneliti data updated:
- Peneliti: Hasiana Rahmani S.S.Tr.Kes.(Rad)
- Institusi: Prodi Imaging Diagnostik - Pascasarjana - Poltekkes Kemenkes Semarang
- Pembimbing: Dr. Gatot Murti Wibowo, S.Pd., M.Sc. (MedTech); Yeti Kartikasari, S.T., M.Kes
- Kontak: rhasiana11@gmail.com 089668070696

`kuesioner-v5-deploy-ios-25butir.zip` It contains the iOS/Apple-native theme, the researcher photo as header logo and favicons, and the 25-item / 13-section instrument ("Klarifikasi Pelaksanaan QA/QC CBCT Ekstraoral"). Deploy steps:

```
unzip kuesioner-v5-deploy-ios-25butir.zip -d /var/www/kuesioner-v3/
chmod 644 /var/www/kuesioner-v3/dist/*
chown root:www-data /var/www/kuesioner-v3/dist/*
systemctl restart kuesioner.service
```

`kuesioner-v6-deploy-merge-25butir.zip` is the current live bundle. It adds the merged UX layer on top of v5: explicit consent checkbox on the landing page, identity gate (drawer/progress/review locked until the respondent name is filled), optional unit brand/model and installation year in the respondent block, reset/draft-delete buttons, J1 datalist of standard constraints, a real date input for K4 (no skip), evidence hint for empty answers, numbering-gap note in Baca semua, and consolidated item wording. Instrument stays 25 items / 13 sections. Same deploy steps with the v6 filename.

