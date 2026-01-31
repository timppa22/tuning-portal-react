# Contributing to Tuning Portal

Tervetuloa projektiin! / Welcome to the project!

## Forkin Käyttöönotto Visual Studio Codessa / Setting Up Your Fork in Visual Studio Code

### Suomeksi

#### 1. Forkkaa ja Kloonaa Repositorio

1. **Forkkaa tämä repositorio** GitHubissa klikkaamalla "Fork" nappia sivun oikeassa ylänurkassa
2. **Kloonaa forkkaamasi repositorio** omalle koneellesi:

```bash
git clone https://github.com/YOUR-USERNAME/tuning-portal-react.git
cd tuning-portal-react
```

Korvaa `YOUR-USERNAME` omalla GitHub käyttäjänimellä.

#### 2. Avaa Projekti Visual Studio Codessa

1. **Käynnistä Visual Studio Code**
2. Valitse `File > Open Folder` (tai `Ctrl+K Ctrl+O`)
3. Siirry kloonattuun hakemistoon ja klikkaa "Select Folder"

Vaihtoehtoisesti voit avata projektin komentoriviltä:

```bash
code .
```

#### 3. Asenna Suositellut Laajennukset

VS Code ehdottaa automaattisesti suositeltuja laajennuksia kun avaat projektin ensimmäistä kertaa. Klikkaa "Install All" asentaaksesi ne.

Voit myös asentaa ne manuaalisesti:

1. Avaa Extensions-näkymä (`Ctrl+Shift+X` tai `Cmd+Shift+X` macOS:lla)
2. Etsi ja asenna seuraavat laajennukset:
   - **Prettier** - Koodin muotoilu
   - **ESLint** - Koodin laadun tarkistus
   - **Tailwind CSS IntelliSense** - Tailwind CSS tuki
   - **TypeScript** - TypeScript tuki
   - **Error Lens** - Inline virheviestit

#### 4. Asenna Projektin Riippuvuudet

Avaa terminaali VS Codessa (`Ctrl+\`` tai `View > Terminal`) ja suorita:

```bash
npm install
```

#### 5. Konfiguroi Ympäristömuuttujat

1. Luo `.env.local` tiedosto projektin juurihakemistoon
2. Kopioi pohja `README.md` tiedostosta
3. Täytä tarvittavat arvot (tietokanta, sähköposti, Stripe, jne.)

```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tuning_portal

# Authentication
JWT_SECRET=your_jwt_secret

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Stripe
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

#### 6. Konfiguroi Tietokanta

Suorita SQL-skriptit MySQL tietokannassa:

```bash
mysql -u your_db_user -p < tuning_portal_full_structure.sql
```

#### 7. Käynnistä Kehityspalvelin

```bash
npm run dev
```

Sovellus on nyt käynnissä osoitteessa [http://localhost:3000](http://localhost:3000)

#### 8. Konfiguroi Upstream Remote (Valinnainen)

Pysyäksesi synkronoituna alkuperäisen projektin kanssa, lisää upstream remote:

```bash
git remote add upstream https://github.com/timppa22/tuning-portal-react.git
```

Päivitä projektisi säännöllisesti:

```bash
git fetch upstream
git merge upstream/main
```

---

### In English

#### 1. Fork and Clone the Repository

1. **Fork this repository** on GitHub by clicking the "Fork" button in the top-right corner
2. **Clone your forked repository** to your local machine:

```bash
git clone https://github.com/YOUR-USERNAME/tuning-portal-react.git
cd tuning-portal-react
```

Replace `YOUR-USERNAME` with your GitHub username.

#### 2. Open Project in Visual Studio Code

1. **Launch Visual Studio Code**
2. Select `File > Open Folder` (or `Ctrl+K Ctrl+O`)
3. Navigate to the cloned directory and click "Select Folder"

Alternatively, open the project from the command line:

```bash
code .
```

#### 3. Install Recommended Extensions

VS Code will automatically suggest recommended extensions when you first open the project. Click "Install All" to install them.

You can also install them manually:

1. Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS)
2. Search for and install the following extensions:
   - **Prettier** - Code formatter
   - **ESLint** - Code quality checker
   - **Tailwind CSS IntelliSense** - Tailwind CSS support
   - **TypeScript** - TypeScript support
   - **Error Lens** - Inline error messages

#### 4. Install Project Dependencies

Open the integrated terminal in VS Code (`Ctrl+\`` or `View > Terminal`) and run:

```bash
npm install
```

#### 5. Configure Environment Variables

1. Create a `.env.local` file in the project root
2. Copy the template from the `README.md` file
3. Fill in the required values (database, email, Stripe, etc.)

```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tuning_portal

# Authentication
JWT_SECRET=your_jwt_secret

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Stripe
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

#### 6. Set Up Database

Run the SQL scripts in your MySQL database:

```bash
mysql -u your_db_user -p < tuning_portal_full_structure.sql
```

#### 7. Start Development Server

```bash
npm run dev
```

The application will now be running at [http://localhost:3000](http://localhost:3000)

#### 8. Configure Upstream Remote (Optional)

To stay in sync with the original project, add the upstream remote:

```bash
git remote add upstream https://github.com/timppa22/tuning-portal-react.git
```

Regularly update your fork:

```bash
git fetch upstream
git merge upstream/main
```

---

## Development Workflow / Kehitystyönkulku

### Making Changes / Muutosten Tekeminen

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes:
   ```bash
   npm run dev
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub

### Code Style / Koodityyli

- This project uses **Prettier** for code formatting
- **ESLint** is used for code quality
- Format on save is enabled by default in VS Code settings
- Follow TypeScript best practices
- Use Tailwind CSS for styling

### Project Structure / Projektirakenne

```
tuning-portal-react/
├── src/
│   ├── app/           # Next.js app router pages and API routes
│   ├── components/    # Reusable React components
│   ├── contexts/      # React context providers
│   ├── db/            # Database utilities
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and services
│   └── utils/         # Helper utilities
├── public/            # Static assets
└── uploads/           # Uploaded ECU files (not in git)
```

## VS Code Tips / VS Code Vinkit

### Hyödyllisiä Pikanäppäimiä / Useful Shortcuts

- `Ctrl+P` - Quick file open / Avaa tiedosto nopeasti
- `Ctrl+Shift+P` - Command palette / Komentopaletti
- `Ctrl+\`` - Toggle terminal / Näytä/piilota terminaali
- `Alt+Shift+F` - Format document / Muotoile dokumentti
- `F12` - Go to definition / Siirry määritelmään
- `Ctrl+Space` - Trigger IntelliSense / Aktivoi IntelliSense

### Debugging / Debuggaus

To debug the Next.js application in VS Code:

1. Set breakpoints in your code by clicking in the gutter
2. Run the debug script:
   ```bash
   npm run debug
   ```
3. In VS Code, press `F5` or go to `Run > Start Debugging`
4. Select "Node.js" as the debugger

## Getting Help / Avun Saaminen

- Check the [README.md](README.md) for general project information
- Review existing issues on GitHub
- Contact the project maintainers

## License

This project is licensed under the MIT License.
