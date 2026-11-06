# Khmer1 Lesson Plan Generator with Supabase & Google Gemini AI

កម្មវិធីជំនួយគ្រូបង្រៀនក្នុងការបង្កើតកិច្ចតែងការបង្រៀនថ្នាក់ទី ១ (Khmer Grade 1 Lesson Plan Generator) ដោយប្រើ Google Gemini AI ព្រមទាំងរក្សាទុកទិន្នន័យលើ Cloud Database ដោយប្រើ **Supabase**។

---

## 🌟 មុខងារសំខាន់ៗ (Features)
- 📝 **បង្កើតកិច្ចតែងការបង្រៀនដោយស្វ័យប្រវត្តិ** ដោយប្រើ Google Gemini AI តាមស្ដង់ដារអប់រំកម្ពុជា (ជំហានទាំង ៥)
- 💾 **រក្សាទុក និងទាញយកទិន្នន័យតាម Supabase (Cloud Database):**
  - រក្សាទុក និងទាញយកបញ្ជីកិច្ចតែងការបង្រៀន
  - គ្រប់គ្រងគណនីគ្រូបង្រៀន និងអ្នកគ្រប់គ្រង (Admin)
  - តាមដានចំនួនបង្កើតឯកសារ
- 📄 **នាំចេញឯកសារច្រើនទម្រង់ (Export):**
  - Word (.docx)
  - PDF (.pdf)
  - បទបង្ហាញ PowerPoint / Google Slides (.pptx)
- 🌓 **គាំទ្រ Dark Mode / Light Mode**
- 🔄 **ដំណើរការបានទាំង Online (Supabase) និង Offline**

---

## 🚀 របៀបតម្លើង និងដំណើរការ (Getting Started)

### ១. ទាញយក Dependencies
```bash
npm install
```

### ២. កំណត់អថេរ Environment Variables
ចម្លងឯកសារ `.env.example` ទៅជា `.env.local` រួចបំពេញព័ត៌មាន៖
```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*(សម្គាល់៖ អ្នកក៏អាចបញ្ចូល Supabase URL និង Anon Key ដោយផ្ទាល់តាមរយៈប៊ូតុងកំណត់ Supabase ក្នុង Header នៃកម្មវិធីបានផងដែរ)*

---

## 🗄️ ការដំឡើង Supabase Database (Database Setup)

១. បង្កើតគម្រោងថ្មីនៅលើ [Supabase](https://supabase.com)
២. ចូលទៅកាន់ **SQL Editor** ក្នុង Supabase Dashboard
៣. ចម្លងកូដ SQL ពីឯកសារ [`supabase_schema.sql`](supabase_schema.sql) យកទៅបិទភ្ជាប់ (Paste) រួចចុច **Run**
៤. ចូលទៅកាន់ **Project Settings -> API** ដើម្បីចម្លង `Project URL` និង `anon public key` មកដាក់ក្នុង `.env.local` ឬក្នុងកម្មវិធីផ្ទាល់។

---

## 💻 ពាក្យបញ្ជាដំណើរការ (Commands)

- ដំណើរការ Development Server:
  ```bash
  npm run dev
  ```
- ពិនិត្យ Type Check:
  ```bash
  npm run lint
  ```
- បង្កើត Build សម្រាប់ Production:
  ```bash
  npm run build
  ```
- មើល Preview Production Build:
  ```bash
  npm run preview
  ```
