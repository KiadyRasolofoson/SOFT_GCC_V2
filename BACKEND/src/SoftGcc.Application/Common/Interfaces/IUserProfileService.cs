using SoftGcc.Application.Dtos.Profile;

namespace SoftGcc.Application.Common.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetProfileAsync(int userId);
}
