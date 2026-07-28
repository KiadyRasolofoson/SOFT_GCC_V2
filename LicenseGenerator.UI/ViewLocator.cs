using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Templates;
using CommunityToolkit.Mvvm.ComponentModel;
using LicenseGenerator.UI.ViewModels;

namespace LicenseGenerator.UI
{
    public class ViewLocator : IDataTemplate
    {
        public Control? Build(object? param)
        {
            if (param is null)
                return null;

            var name = param.GetType().FullName!
                .Replace("ViewModel", "View")
                .Replace("ViewModels", "Views");

            var type = Type.GetType(name);
            if (type != null)
            {
                var control = (Control)Activator.CreateInstance(type)!;
                control.DataContext = param;
                return control;
            }

            return new TextBlock { Text = "Not Found: " + name };
        }

        public bool Match(object? data)
        {
            return data is ObservableObject;
        }
    }
}
