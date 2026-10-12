async (page) => {
  const assert = {
    equal(actual, expected) {
      if (actual !== expected)
        throw new Error(
          "MOCK assertion failed: " + actual + " !== " + expected,
        );
    },
  };
  assert.equal(await page.locator("main form").count(), 1);
  assert.equal(
    await page.getByLabel("Password").getAttribute("autocomplete"),
    "current-password",
  );
  await page.getByLabel("Email").fill("pelapor@example.invalid");
  await page.getByLabel("Password").fill("legacy");
  await page
    .locator("main")
    .getByRole("button", { name: "Masuk", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Sampaikan yang Anda temukan" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Laporan langsung", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  console.log(
    "PASS MOCK: one login form; legacy password; return to selected active report",
  );
};
