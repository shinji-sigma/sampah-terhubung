async (page) => {
  await page.unroute('https://tile.openstreetmap.org/**')
  await page.getByRole('button', {name: /Keluar dari akun .* MOCK/}).waitFor()
  const account = await page.getByRole('button', {name: /Keluar dari akun .* MOCK/}).getAttribute('aria-label')
  const role = account.includes('Koordinator') ? 'coordinator' : account.includes('Petugas') ? 'worker' : 'report'
  const results = []
  const navigate = async label => {
    const button = page.getByRole('button', {name: label, exact: true})
    if (!(await button.isVisible())) await page.getByRole('button', {name: 'Buka navigasi', exact: true}).click()
    await button.click()
  }
  for (const [size, width, height] of [['desktop',1440,1000],['mobile',360,800]]) {
    await page.setViewportSize({width,height})
    await navigate('Beranda')
    if (role === 'report') await page.getByRole('button', {name:'Buat laporan',exact:true}).click()
    else await navigate('Ruang kerja')
    await page.waitForFunction(() => window.scrollY === 0)
    await page.screenshot({path:`output/playwright/design-revision/after/${size}-${role}.png`})
    const dimensions = await page.evaluate(() => ({viewport:innerWidth, content:document.documentElement.scrollWidth}))
    if (dimensions.content > dimensions.viewport) throw Error(`${size} ${role}: horizontal overflow`)
    results.push({size,role,...dimensions})
    if (role === 'report') {
      await navigate('Kegiatan')
      await page.getByRole('heading', {name:'Kerja bakti taman · MOCK',exact:true}).waitFor()
      await page.waitForFunction(() => window.scrollY === 0)
      await page.screenshot({path:`output/playwright/design-revision/after/${size}-events-filled-mock.png`})
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      if(overflow) throw Error(`${size} filled activity: horizontal overflow`)
    }
  }
  return results
}
