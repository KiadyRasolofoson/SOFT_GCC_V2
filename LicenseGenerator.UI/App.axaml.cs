using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using LicenseGenerator.UI.Services;
using LicenseGenerator.UI.ViewModels;
using LicenseGenerator.UI.Views;

namespace LicenseGenerator.UI
{
    public partial class App : Application
    {
        public override void Initialize()
        {
            AvaloniaXamlLoader.Load(this);
        }

        public override void OnFrameworkInitializationCompleted()
        {
            if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
            {
                var signer = new LicenseSigner();
                var settingsService = new SettingsService();
                desktop.MainWindow = new MainWindow
                {
                    DataContext = new MainWindowViewModel(signer, settingsService)
                };
            }

            base.OnFrameworkInitializationCompleted();
        }
    }
}
