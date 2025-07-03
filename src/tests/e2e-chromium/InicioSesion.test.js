const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

describe('Página de Inicio de Sesión', function () {
  this.timeout(30000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless'); // Ejecutar sin GUI
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.get('http://52.224.217.93/iniciar-sesion');
  });

  after(async () => {
    await driver.quit();
  });

  it('debe mostrar el título "Iniciar Sesión"', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath("//*[self::h1 or self::h4][contains(text(), 'Iniciar Sesión')]")),
      5000
    );
    const texto = await titulo.getText();
    expect(texto).to.include('Iniciar Sesión');
  });

  it('debe mostrar los campos de correo y contraseña', async () => {
    const email = await driver.findElement(By.name('email'));
    const password = await driver.findElement(By.name('password'));

    expect(await email.isDisplayed()).to.be.true;
    expect(await password.isDisplayed()).to.be.true;
  });

  it('debe mostrar error con credenciales incorrectas', async () => {
    const email = await driver.findElement(By.name('email'));
    const password = await driver.findElement(By.name('password'));

    await email.clear();
    await password.clear();

    await email.sendKeys('usuario_invalido@mail.com');
    await password.sendKeys('ClaveIncorrecta123@');

    const boton = await driver.findElement(By.css('button[type="submit"]'));
    await boton.click();

    const alerta = await driver.wait(
      until.elementLocated(By.css('.MuiAlert-root')),
      10000
    );
    const texto = await alerta.getText();

    expect(texto.toLowerCase()).to.match(/credenciales|incorrecta|error/);
  });

  it('debe iniciar sesión con credenciales válidas', async () => {
    await driver.navigate().refresh();

    await driver.findElement(By.name('email')).sendKeys(`mariamaria@example.com`);
    await driver.findElement(By.name('password')).sendKeys(`Maria12345678?`);

    const boton = await driver.findElement(By.css('button[type="submit"]'));
    await boton.click();

    await driver.wait(until.urlIs('http://52.224.217.93/'), 5000);
    const actual = await driver.getCurrentUrl();
    expect(actual).to.equal('http://52.224.217.93/');
  });
});
