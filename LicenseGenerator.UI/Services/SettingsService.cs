using System.Text.Json;
using LicenseGenerator.UI.Models;

namespace LicenseGenerator.UI.Services
{
    /// <summary>
    /// Service de persistance des paramètres de l'application.
    /// Sauvegarde et charge un fichier JSON dans le répertoire de config utilisateur.
    /// </summary>
    public class SettingsService
    {
        private static readonly string ConfigDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".config",
            "LicenseGenerator.UI");

        private static readonly string ConfigFile = Path.Combine(ConfigDir, "settings.json");

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };

        /// <summary>
        /// Charge les paramètres depuis le fichier JSON, ou retourne les valeurs par défaut.
        /// </summary>
        public AppSettings Load()
        {
            try
            {
                if (File.Exists(ConfigFile))
                {
                    var json = File.ReadAllText(ConfigFile);
                    var settings = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions);
                    if (settings != null)
                        return settings;
                }
            }
            catch
            {
                // Fichier corrompu ou inaccessible → on utilise les défauts
            }

            return new AppSettings();
        }

        /// <summary>
        /// Sauvegarde les paramètres dans le fichier JSON.
        /// </summary>
        public void Save(AppSettings settings)
        {
            try
            {
                Directory.CreateDirectory(ConfigDir);
                var json = JsonSerializer.Serialize(settings, JsonOptions);
                File.WriteAllText(ConfigFile, json);
            }
            catch
            {
                // Erreur silencieuse : l'application reste fonctionnelle sans persistance
            }
        }

        /// <summary>
        /// Retourne le chemin du fichier de configuration (pour information).
        /// </summary>
        public static string GetConfigFilePath() => ConfigFile;
    }
}
