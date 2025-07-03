// tests/inicio.test.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

describe('Página de Inicio', function () {
  this.timeout(20000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless'); // Sin GUI
    options.addArguments('--no-sandbox'); // Recomendado para contenedores o VMs
    options.addArguments('--disable-dev-shm-usage'); // Evita problemas de espacio en /dev/shm
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

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
