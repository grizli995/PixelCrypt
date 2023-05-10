using Microsoft.AspNetCore.Mvc;
using PixelCrypt.API.Common.Models;
using StegSharp.Application.Common.Exceptions;
using StegSharp.Application.Common.Interfaces;
using System.Drawing;
using System.Net;
using System.Net.Http.Headers;

namespace PixelCrypt.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EmbedExtractController : ControllerBase
    {
        private readonly ILogger<EmbedExtractController> _logger;
        private readonly IF5Service _f5Service;
        private readonly IHostEnvironment _environment;
        private List<string> _savedFiles = new List<string>();

        public EmbedExtractController(ILogger<EmbedExtractController> logger, IF5Service f5Service,
            IHostEnvironment environment)
        {
            _logger = logger;
            _f5Service = f5Service;
            _environment = environment;
        }

        [HttpPost("embed")]
        public IActionResult Embed([FromForm] EmbedRequest request)
        {
            // Validate input
            if (request.Image == null || request.Password == null || request.Message == null)
            {
                return BadRequest("Invalid input.");
            }

            var result = new EmbedResult();
            string embeddedImagePath;
            try
            {
                embeddedImagePath = ProcessImage(request.Image.OpenReadStream(), request.Password, request.Message);
            }
            catch (CapacityException ce)
            {
                result.ErrorMessage = ce.Message;
                return Ok(result);
            }
            catch (Exception ex)
            {
                result.ErrorMessage = "Internal Server Error: " + ex.Message;
                return StatusCode(500, result);
            }
            var embeddedImage = System.IO.File.ReadAllBytes(embeddedImagePath);
            if (System.IO.File.Exists(embeddedImagePath))
            {
                byte[] imageData = System.IO.File.ReadAllBytes(embeddedImagePath);

                string contentType = "image/jpeg";

                return File(imageData, contentType);
            }
            else
            {
                // Return a 404 error if the file does not exist
                return NotFound();
            }
        }

        [HttpPost("extract")]
        public IActionResult Extract([FromForm] ExtractRequest request)
        {
            // Validate input
            if (request.Image == null || request.Password == null)
            {
                return BadRequest("Invalid input.");
            }
            string extractedMessage;
            var result = new ExtractResult();
            try
            {
                extractedMessage = ExtractMessage(request.Image.OpenReadStream(), request.Password);
            }
            catch (CapacityException ce)
            {
                result.ErrorMessage = ce.Message;
                return Ok(result);
            }
            catch (Exception ex)
            {
                result.ErrorMessage = "Internal Server Error: " + ex.Message;
                return StatusCode(500, result);
            }

            // Create and return the response
            result.Message = extractedMessage;

            return Ok(result);
        }

        private string ProcessImage(Stream imageStream, string password, string message)
        {
            var fileName = Path.Combine(GetTempStoragePath(), Guid.NewGuid().ToString() + ".jpg");
            var outPath = fileName.Substring(0, fileName.Length - 4) + "_embedded.jpg";

            Image image = Image.FromStream(imageStream);

            using (FileStream fileStream = new FileStream(outPath, FileMode.Create, FileAccess.Write))
            {
                using (BinaryWriter binaryWriter = new BinaryWriter(fileStream))
                {
                    _f5Service.Embed(image, password, message, binaryWriter);
                }
            }

            _savedFiles.Add(outPath);

            return outPath;
        }

        private string ExtractMessage(Stream imageStream, string password)
        {
            string message;
            using (BinaryReader binaryReader = new BinaryReader(imageStream))
            {
                message = _f5Service.Extract(password, binaryReader);
            }

            return message;
        }

        private string GetTempStoragePath()
        {
            string tempFolderPath = Path.Combine(_environment.ContentRootPath, "temp");
            Directory.CreateDirectory(tempFolderPath); // This ensures that the 'temp' folder exists.
            return tempFolderPath;
        }
    }
}