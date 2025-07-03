const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/firefox');
const { expect } = require('chai');

describe('Página de Registro', function () {
  this.timeout(30000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('firefox').build();
    await driver.get('http://52.224.217.93/registro');
  });

  after(async () => {
    await driver.quit();
  });

  it('debe mostrar el título "Registrarse"', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath("//*[self::h1 or self::h4][contains(text(), 'Registrarse')]")),
      5000
    );
    const texto = await titulo.getText();
    expect(texto).to.include('Registrarse');
  });

  it('debe mostrar los campos requeridos', async () => {
    const nombre = await driver.findElement(By.name('nombre'));
    const email = await driver.findElement(By.name('email'));
    const password = await driver.findElement(By.name('password'));
    const confirmPassword = await driver.findElement(By.name('confirmPassword'));

    expect(await nombre.isDisplayed()).to.be.true;
    expect(await email.isDisplayed()).to.be.true;
    expect(await password.isDisplayed()).to.be.true;
    expect(await confirmPassword.isDisplayed()).to.be.true;
  });

  it('debe mostrar un error si las contraseñas no coinciden', async () => {
    await driver.findElement(By.name('nombre')).sendKeys('Usuario Prueba');
    await driver.findElement(By.name('email')).sendKeys(`test${Date.now()}@mail.com`);
    await driver.findElement(By.name('password')).sendKeys('Contraseña123@');
    await driver.findElement(By.name('confirmPassword')).sendKeys('Distinta123@');

    const boton = await driver.findElement(
      By.xpath("//*[self::button or self::a or self::span][contains(., 'Registrarse')]")
    );
    await boton.click();

    const alerta = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Las contraseñas no coinciden')]")),
      5000
    );
    const texto = await alerta.getText();
    expect(texto).to.include('Las contraseñas no coinciden');
  });

  it('debe mostrar error si la contraseña no es fuerte', async () => {
    await driver.navigate().refresh();

    await driver.findElement(By.name('nombre')).sendKeys('Usuario Prueba');
    await driver.findElement(By.name('email')).sendKeys(`test${Date.now()}@mail.com`);
    await driver.findElement(By.name('password')).sendKeys('123');
    await driver.findElement(By.name('confirmPassword')).sendKeys('123');

    const boton = await driver.findElement(
      By.xpath("//*[self::button or self::a or self::span][contains(., 'Registrarse')]")
    );
    await boton.click();

    const alerta = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'La contraseña debe tener')]")),
      5000
    );
    const texto = await alerta.getText();
    expect(texto).to.include('La contraseña debe tener');
  });

  it('debería registrar un nuevo usuario correctamente', async () => {
    await driver.navigate().refresh();

    const timestamp = Date.now();

    await driver.findElement(By.name('nombre')).sendKeys('Usuario Nuevo');
    await driver.findElement(By.name('email')).sendKeys(`usuario${timestamp}@mail.com`);
    await driver.findElement(By.name('password')).sendKeys('ClaveSegura1@');
    await driver.findElement(By.name('confirmPassword')).sendKeys('ClaveSegura1@');

    const boton = await driver.findElement(
      By.xpath("//*[self::button or self::a or self::span][contains(., 'Registrarse')]")
    );
    await boton.click();

    // Verificar redirección al home
    await driver.wait(until.urlIs('http://52.224.217.93/'), 5000);
    const actual = await driver.getCurrentUrl();
    expect(actual).to.equal('http://52.224.217.93/');
  });
});
