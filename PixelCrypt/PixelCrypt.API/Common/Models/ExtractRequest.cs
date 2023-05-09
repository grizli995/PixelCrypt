namespace PixelCrypt.API.Common.Models
{
    public class ExtractRequest
    {
        public string Password { get; set; }
        public IFormFile Image { get; set; }
    }
}
