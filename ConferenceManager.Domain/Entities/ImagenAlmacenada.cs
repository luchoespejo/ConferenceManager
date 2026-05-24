namespace ConferenceManager.Models;

public class ImagenAlmacenada
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string ContentType { get; set; } = null!;
    public byte[] Datos { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
