# I-MAX POS & Inventory Management System

ဒီ Project ဟာ Warehouse နဲ့ Supplier တွေအတွက် ရည်ရွယ်ထားတဲ့ Online Order & Inventory Dashboard ရဲ့ Backend API ဖြစ်ပါတယ်။ မကြာသေးမီက Project ကို ပိုမိုစနစ်ကျစေဖို့ **SRC (Service-Repository-Controller)** Pattern သို့ အကြီးစား ပြောင်းလဲ တည်ဆောက်ထားပါတယ်။

## 🛠 Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Storage**: DigitalOcean Spaces (S3 Compatible)
- **Security**: JWT, BcryptJS, Helmet, Rate-limit
- **File Upload**: Multer

## 🏗 Architecture (SRC Pattern)
Project ကို Layer ၄ ခုနဲ့ တည်ဆောက်ထားပါတယ်:
1. **Controllers**: HTTP Requests တွေကို လက်ခံပြီး Response ပြန်ပေးပါတယ်။
2. **Services**: Business Logic တွေနဲ့ လုပ်ငန်းစဉ်တွေကို လုပ်ဆောင်ပါတယ်။
3. **Repositories**: Database Query တွေကို တိုက်ရိုက်ကိုင်တွယ်ပါတယ်။
4. **DTOs (Data Transfer Objects)**: Data တွေကို Layer တစ်ခုကနေ တစ်ခုကို သယ်ယူတဲ့အခါ ပုံစံသွင်းပေးပါတယ်။

## 📁 Folder Structure
- `src/controllers/`: API Endpoints များ။
- `src/services/`: အဓိက လုပ်ငန်းစဉ် Logic များ။
- `src/repositories/`: Database queries (Mongoose models) များ။
- `src/dtos/`: Data validation & transformation objects များ။
- `src/loaders/`: Startup configurations (DB, Services wiring) များ။
- `src/middlewares/`: Auth protect, Multer upload စသည်တို့။
- `src/models/`: Mongoose schemas များ။
- `src/routes/`: API routing ပိုင်းများ။
- `src/validators/`: Input validation logic များ။

## 🚀 Setup & Installation

### ၁။ Requirements
- Node.js (v18+)
- MongoDB (Local သို့မဟုတ် Atlas)
- DigitalOcean Spaces (Optional - for images)

### ၂။ Installation
```bash
# Dependencies သွင်းရန်
npm install
