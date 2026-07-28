using System.Collections.ObjectModel;
using System.Security.Cryptography;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LicenseGenerator.UI.Models;
using LicenseGenerator.UI.Services;

namespace LicenseGenerator.UI.ViewModels
{
    /// <summary>
    /// ViewModel principal du générateur de licence.
    /// Gère la saisie du formulaire, la génération de la clé et l'appel à l'API backend.
    /// </summary>
    public partial class MainWindowViewModel : ObservableObject
    {
        private readonly LicenseSigner _signer;
        private readonly SettingsService _settingsService;

        // ──────────────────── Champs de saisie ────────────────────

        [ObservableProperty]
        private string _customerId = string.Empty;

        [ObservableProperty]
        private string _machineId = string.Empty;

        [ObservableProperty]
        private bool _useDurationMode = true;

        [ObservableProperty]
        private int _durationMonths = 12;

        [ObservableProperty]
        private DateTimeOffset _expireAtDate = DateTimeOffset.UtcNow.AddYears(1);

        [ObservableProperty]
        private string _licenseType = "Standard";

        [ObservableProperty]
        private string _featuresText = string.Empty;

        [ObservableProperty]
        private string _privateKeyFilePath = string.Empty;

        [ObservableProperty]
        private string _apiBaseUrl = "http://localhost:5001";

        // ──────────────────── État / Résultat ────────────────────

        [ObservableProperty]
        private bool _isGenerating;

        [ObservableProperty]
        private string _statusMessage = string.Empty;

        [ObservableProperty]
        private bool _isError;

        [ObservableProperty]
        private string _generatedLicenseKey = string.Empty;

        [ObservableProperty]
        private bool _hasGeneratedKey;

        // ──────────────────── Détails licence générée ─────────────

        [ObservableProperty]
        private string _generatedLicenseId = string.Empty;

        [ObservableProperty]
        private string _generatedCustomerId = string.Empty;

        [ObservableProperty]
        private string _generatedMachineId = string.Empty;

        [ObservableProperty]
        private string _generatedExpireAt = string.Empty;

        [ObservableProperty]
        private string _generatedLicenseType = string.Empty;

        [ObservableProperty]
        private string _generatedFeatures = string.Empty;

        [ObservableProperty]
        private bool _hasLicenseDetails;

        // ──────────────────── Types de licence disponibles ─────────

        public ObservableCollection<string> LicenseTypes { get; } = new()
        {
            "Trial",
            "Standard",
            "Enterprise"
        };

        // ──────────────────── Constructeurs ────────────────────────

        public MainWindowViewModel(LicenseSigner signer, SettingsService settingsService)
        {
            _signer = signer;
            _settingsService = settingsService;
            _licenseType = "Standard";

            LoadSettings();
        }

        /// <summary>Constructeur sans paramètre pour le designer Avalonia.</summary>
        public MainWindowViewModel() : this(new LicenseSigner(), new SettingsService()) { }

        // ──────────────────── Persistance ──────────────────────────

        /// <summary>
        /// Charge les paramètres sauvegardés au démarrage.
        /// </summary>
        private void LoadSettings()
        {
            var settings = _settingsService.Load();
            ApiBaseUrl = settings.ApiBaseUrl;
            PrivateKeyFilePath = settings.PrivateKeyFilePath;
            LicenseType = settings.LicenseType;
            UseDurationMode = settings.UseDurationMode;
            DurationMonths = settings.DurationMonths;

            // Notifier les propriétés liées (déjà fait par les setters générés)
        }

        /// <summary>
        /// Sauvegarde automatique des paramètres persistants
        /// à chaque modification des propriétés concernées.
        /// </summary>
        partial void OnApiBaseUrlChanged(string value) => AutoSave();
        partial void OnPrivateKeyFilePathChanged(string value) => AutoSave();
        partial void OnLicenseTypeChanged(string value) => AutoSave();
        partial void OnUseDurationModeChanged(bool value) => AutoSave();
        partial void OnDurationMonthsChanged(int value) => AutoSave();

        private void AutoSave()
        {
            _settingsService.Save(new AppSettings
            {
                ApiBaseUrl = ApiBaseUrl,
                PrivateKeyFilePath = PrivateKeyFilePath,
                LicenseType = LicenseType,
                UseDurationMode = UseDurationMode,
                DurationMonths = DurationMonths
            });
        }

        // ──────────────────── Commandes ────────────────────────────

        /// <summary>
        /// Ouvre un sélecteur de fichier pour choisir le fichier de clé privée (.key ou .pem).
        /// </summary>
        [RelayCommand]
        private async Task BrowsePrivateKey()
        {
            try
            {
                if (Avalonia.Application.Current?.ApplicationLifetime is not
                    Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop)
                    return;

                var storageProvider = desktop.MainWindow?.StorageProvider;
                if (storageProvider == null) return;

                var files = await storageProvider.OpenFilePickerAsync(
                    new Avalonia.Platform.Storage.FilePickerOpenOptions
                    {
                        Title = "Sélectionner la clé privée RSA",
                        AllowMultiple = false,
                        FileTypeFilter = new List<Avalonia.Platform.Storage.FilePickerFileType>
                        {
                            new("Fichiers de clé") { Patterns = new[] { "*.key", "*.pem", "*" } }
                        }
                    });

                if (files.Count > 0)
                {
                    PrivateKeyFilePath = files[0].Path.LocalPath;
                }
            }
            catch (Exception ex)
            {
                SetError($"Erreur lors de la sélection du fichier : {ex.Message}");
            }
        }

        /// <summary>
        /// Bascule vers le mode "durée en mois".
        /// Appelé par l'événement Checked du RadioButton correspondant.
        /// </summary>
        [RelayCommand]
        private void SetDurationMode() => UseDurationMode = true;

        /// <summary>
        /// Bascule vers le mode "date d'expiration directe".
        /// Appelé par l'événement Checked du RadioButton correspondant.
        /// </summary>
        [RelayCommand]
        private void SetDateMode() => UseDurationMode = false;

        /// <summary>
        /// Génère la clé de licence et l'active automatiquement dans la base de données.
        /// </summary>
        [RelayCommand]
        private async Task Generate()
        {
            // ─── Nettoyage état précédent ───
            ClearResults();

            // ─── Validation ───
            var errors = ValidateForm();
            if (errors.Count > 0)
            {
                SetError(string.Join("\n", errors));
                return;
            }

            IsGenerating = true;
            StatusMessage = "Génération de la licence en cours...";
            IsError = false;

            try
            {
                // ─── 1. Lire la clé privée ───
                string privateKeyPem;
                try
                {
                    privateKeyPem = await File.ReadAllTextAsync(PrivateKeyFilePath);
                }
                catch (Exception ex)
                {
                    SetError($"Impossible de lire le fichier de clé privée : {ex.Message}");
                    return;
                }

                // ─── 2. Construire le payload ───
                var expireAt = UseDurationMode
                    ? DateTime.UtcNow.AddMonths(DurationMonths)
                    : ExpireAtDate.UtcDateTime;

                var features = string.IsNullOrWhiteSpace(FeaturesText)
                    ? new List<string>()
                    : FeaturesText.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .ToList();

                var payload = new LicensePayload
                {
                    LicenseId = Guid.NewGuid().ToString(),
                    CustomerId = CustomerId.Trim(),
                    MachineId = MachineId.Trim(),
                    IssuedAt = DateTime.UtcNow,
                    ExpireAt = expireAt,
                    LicenseType = LicenseType,
                    Features = features
                };

                // ─── 3. Signer le payload ───
                string licenseKey;
                try
                {
                    licenseKey = _signer.GenerateLicenseKey(payload, privateKeyPem);
                }
                catch (CryptographicException ex)
                {
                    SetError($"Erreur de signature : la clé privée est invalide ou corrompue.\nDétail : {ex.Message}");
                    return;
                }

                // ─── 4. Afficher la clé générée ───
                GeneratedLicenseKey = licenseKey;
                HasGeneratedKey = true;

                // ─── 5. Détails de la licence ───
                GeneratedLicenseId = payload.LicenseId;
                GeneratedCustomerId = payload.CustomerId;
                GeneratedMachineId = payload.MachineId;
                GeneratedExpireAt = payload.ExpireAt.ToString("yyyy-MM-dd HH:mm:ss") + " UTC";
                GeneratedLicenseType = payload.LicenseType;
                GeneratedFeatures = features.Count > 0 ? string.Join(", ", features) : "Aucune";
                HasLicenseDetails = true;

                // ─── 6. Activer automatiquement dans la base via l'API ───
                StatusMessage = "Activation dans la base de données en cours...";

                var apiClient = new LicenseApiClient(new HttpClient { Timeout = TimeSpan.FromSeconds(15) });
                var result = await apiClient.ActivateLicenseAsync(licenseKey, ApiBaseUrl.Trim());

                if (result.IsSuccess)
                {
                    StatusMessage = $"✅ Licence générée et activée avec succès !";
                    IsError = false;
                }
                else
                {
                    // La licence est générée mais l'activation API a échoué
                    StatusMessage = $"⚠️ Licence générée mais activation API échouée :\n{result.Message}";
                    IsError = true;
                }
            }
            catch (Exception ex)
            {
                SetError($"Erreur inattendue lors de la génération : {ex.Message}");
            }
            finally
            {
                IsGenerating = false;
            }
        }

        /// <summary>
        /// Copie la clé de licence générée dans le presse-papier.
        /// </summary>
        [RelayCommand]
        private async Task CopyKey()
        {
            if (string.IsNullOrWhiteSpace(GeneratedLicenseKey)) return;

            if (Avalonia.Application.Current?.ApplicationLifetime is
                Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop)
            {
                var clipboard = desktop.MainWindow?.Clipboard;
                if (clipboard != null)
                {
                    await clipboard.SetTextAsync(GeneratedLicenseKey);
                    StatusMessage = "📋 Clé copiée dans le presse-papier !";
                    IsError = false;
                }
            }
        }

        // ──────────────────── Méthodes privées ─────────────────────

        private List<string> ValidateForm()
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(CustomerId))
                errors.Add("• Le Customer ID est requis.");

            if (string.IsNullOrWhiteSpace(MachineId))
                errors.Add("• Le Machine ID est requis.");

            if (!UseDurationMode && ExpireAtDate.UtcDateTime <= DateTime.UtcNow)
                errors.Add("• La date d'expiration doit être dans le futur.");

            if (UseDurationMode && DurationMonths <= 0)
                errors.Add("• La durée doit être supérieure à 0 mois.");

            if (string.IsNullOrWhiteSpace(PrivateKeyFilePath))
                errors.Add("• Le fichier de clé privée est requis.");
            else if (!File.Exists(PrivateKeyFilePath))
                errors.Add($"• Le fichier de clé privée est introuvable : {PrivateKeyFilePath}");

            if (string.IsNullOrWhiteSpace(ApiBaseUrl))
                errors.Add("• L'URL de l'API est requise.");
            else if (!Uri.TryCreate(ApiBaseUrl.Trim(), UriKind.Absolute, out var uri)
                     || (uri.Scheme != "http" && uri.Scheme != "https"))
                errors.Add("• L'URL de l'API doit être une URL valide (http:// ou https://).");

            return errors;
        }

        private void SetError(string message)
        {
            StatusMessage = $"❌ {message}";
            IsError = true;
            IsGenerating = false;
        }

        private void ClearResults()
        {
            GeneratedLicenseKey = string.Empty;
            HasGeneratedKey = false;
            GeneratedLicenseId = string.Empty;
            GeneratedCustomerId = string.Empty;
            GeneratedMachineId = string.Empty;
            GeneratedExpireAt = string.Empty;
            GeneratedLicenseType = string.Empty;
            GeneratedFeatures = string.Empty;
            HasLicenseDetails = false;
            StatusMessage = string.Empty;
            IsError = false;
        }
    }
}
