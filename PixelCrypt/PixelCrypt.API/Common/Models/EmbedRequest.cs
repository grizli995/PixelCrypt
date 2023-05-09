namespace PixelCrypt.API.Common.Models
{
    public class EmbedRequest
    {
        public string Message { get; set; }
        public string Password { get; set; }
        public IFormFile Image { get; set; }
    }
}
