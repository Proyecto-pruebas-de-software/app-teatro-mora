// tests/inicio.test.js
const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
require('geckodriver');

describe('Página de Inicio', function () {
  this.timeout(20000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('firefox').build();
    await driver.get('http://52.224.217.93/');
  });

  after(async () => {
    await driver.quit();
  });

  it('debe mostrar el título principal', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(., 'Bienvenido al Teatro Mora')]")),
      5000
    );
    expect(await titulo.getText()).to.include('Bienvenido al Teatro Mora');
  });

  it('debe mostrar el subtítulo de bienvenida', async () => {
    const subtitulo = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(., 'Disfruta de la magia del teatro')]")),
      5000
    );
    expect(await subtitulo.getText()).to.include('Disfruta de la magia del teatro');
  });

  it('debe tener un botón para comprar boletos', async () => {
    const boton = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a or self::span][contains(., 'Comprar Boletos')]")),
      5000
    );
    const visible = await boton.isDisplayed();
    expect(visible).to.be.true;
  });

  it('debe mostrar el subtítulo "Próximos Espectáculos"', async () => {
    const subtituloEventos = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(., 'Próximos Espectáculos')]")),
      5000
    );
    expect(await subtituloEventos.getText()).to.include('Próximos Espectáculos');
  });

  it('debe mostrar al menos un evento o un mensaje de que no hay eventos', async () => {
    const eventosOmensaje = await driver.wait(
      until.elementLocated(By.xpath(
        "//*[contains(., 'No hay próximos eventos programados') or contains(., 'Más Información')]"
      )),
      5000
    );
    const texto = await eventosOmensaje.getText();
    expect(
      texto.includes('No hay próximos eventos programados') || texto.includes('Más Información')
    ).to.be.true;
  });
});
