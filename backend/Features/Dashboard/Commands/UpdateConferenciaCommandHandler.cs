using ConferenceManager.Data;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Features.Dashboard.Commands;

public class UpdateConferenciaCommandHandler(AppDbContext context) : IUpdateConferenciaCommandHandler
{
    public async Task<ServiceResult> ExecuteAsync(UpdateConferenciaCommand command)
    {
        var conf = await context.Conferencias.FindAsync(command.ConferenciaId);
        if (conf is null)
            return ServiceResult.Fail("NOT_FOUND", "Conferencia no encontrada.");

        if (command.Nombre != null) conf.Nombre = command.Nombre;
        if (command.Descripcion != null) conf.Descripcion = command.Descripcion;
        if (command.ColorPrimario != null) conf.ColorPrimario = command.ColorPrimario;
        if (command.ColorSecundario != null) conf.ColorSecundario = command.ColorSecundario;
        if (command.LogoUrl != null) conf.LogoUrl = command.LogoUrl;
        if (command.BannerUrl != null) conf.BannerUrl = command.BannerUrl;
        if (command.FaviconUrl != null) conf.FaviconUrl = command.FaviconUrl;

        context.Conferencias.Update(conf);
        await context.SaveChangesAsync();

        return ServiceResult.Ok();
    }
}
