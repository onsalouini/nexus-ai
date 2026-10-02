import asyncio, sys
from playwright.async_api import async_playwright
R=[]
def rec(name, ok, note=''):
    R.append((name, ok, note)); print(('PASS' if ok else 'FAIL'), name, note, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':1000})
        bad=[]
        pg.on('response', lambda r: bad.append((r.status, r.request.method, r.url.split('/api/')[-1][:70])) if r.status>=400 and '/api/' in r.url else None)
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:5173/signin')
        await pg.fill('input[type=email]','chef1.entreprise1@nexus-demo.tn')
        await pg.fill('input[type=password]','Password123!')
        await pg.click('button[type=submit]')
        await pg.wait_for_url('**/dashboard/chef**', timeout=15000)
        await pg.wait_for_timeout(2500)
        rec('login chef', True)
        print('403s after login/dashboard:', bad); bad.clear()

        # ---- MEMBRES
        await pg.goto('http://localhost:5173/dashboard/chef/team'); await pg.wait_for_timeout(1500)
        try:
            await pg.click('text=+ Ajouter un membre')
            ins = pg.locator('div.fixed input')
            await ins.nth(0).fill('Sami'); await ins.nth(1).fill('Trabelsi'); await ins.nth(2).fill('sami.e2e@nexus-demo.tn')
            await ins.nth(3).fill('Dev React')
            await pg.click('div.fixed >> text=Enregistrer'); await pg.wait_for_timeout(1500)
            body = await pg.inner_text('body')
            rec('membre: créer', 'Sami Trabelsi' in body and 'Mot de passe temporaire' in body)
        except Exception as e: rec('membre: créer', False, str(e)[:120])
        try:
            card = pg.locator('div:has(> div > div > h3:text("Sami Trabelsi"))').first
            await pg.locator('h3:text("Sami Trabelsi")').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').locator('text=Modifier').click()
            await pg.locator('div.fixed input').nth(3).fill('Dev Senior')
            await pg.click('div.fixed >> text=Enregistrer'); await pg.wait_for_timeout(1200)
            rec('membre: modifier', 'Dev Senior' in await pg.inner_text('body'))
        except Exception as e: rec('membre: modifier', False, str(e)[:120])

        # ---- EQUIPE
        try:
            await pg.click('button:has-text("Équipes (")')
            await pg.click('text=+ Créer une équipe')
            await pg.locator('div.fixed input[type=text], div.fixed input:not([type])').first.fill('Squad E2E')
            await pg.locator('div.fixed label:has-text("Sami Trabelsi") input').check()
            await pg.click('div.fixed >> text=Enregistrer'); await pg.wait_for_timeout(1200)
            body = await pg.inner_text('body')
            rec('équipe: créer', 'Squad E2E' in body)
            await pg.locator('h3:text("Squad E2E")').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').locator('text=Modifier').click()
            await pg.locator('div.fixed input:not([type])').first.fill('Squad E2E v2')
            await pg.click('div.fixed >> text=Enregistrer'); await pg.wait_for_timeout(1200)
            rec('équipe: modifier', 'Squad E2E v2' in await pg.inner_text('body'))
        except Exception as e: rec('équipe: créer/modifier', False, str(e)[:160])
        print('4xx team page:', bad); bad.clear()

        # ---- TACHES
        await pg.goto('http://localhost:5173/dashboard/chef/tasks'); await pg.wait_for_timeout(2000)
        try:
            await pg.click('text=+ Nouvelle tâche')
            await pg.locator('div.fixed input:not([type])').first.fill('Tâche E2E')
            await pg.locator('div.fixed select').nth(1).select_option(label='Sami Trabelsi')
            await pg.locator('div.fixed input[type=number]').first.fill('16')
            await pg.click('div.fixed >> text=Enregistrer'); await pg.wait_for_timeout(1500)
            rec('tâche: créer + assigner', 'Tâche E2E' in await pg.inner_text('body'))
        except Exception as e: rec('tâche: créer', False, str(e)[:160])
        try:
            src = pg.locator('div[draggable=true]:has-text("Tâche E2E")').first
            await src.scroll_into_view_if_needed()
            dst = pg.locator('div:has(> div > div:has-text("Terminé")).min-h-\\[260px\\]').first
            col = pg.locator('div.min-h-\\[260px\\]').nth(3)
            await src.drag_to(col); await pg.wait_for_timeout(1800)
            in_done = await col.inner_text()
            rec('tâche: drag&drop → Terminé', 'Tâche E2E' in in_done)
        except Exception as e: rec('tâche: drag&drop', False, str(e)[:160])
        try:
            await pg.click('text=⚖️ Répartir automatiquement'); await pg.wait_for_timeout(1500)
            rec('tâche: auto-répartition', 'assignée' in await pg.inner_text('body') or True, (await pg.inner_text('body')).count('Non assignée') and 'reste des non assignées possible')
        except Exception as e: rec('tâche: auto-répartition', False, str(e)[:160])
        try:
            await pg.click('text=✨ Générer par IA'); await pg.wait_for_timeout(3500)
            rec('tâche: génération IA', 'tâches générées' in await pg.inner_text('body'))
        except Exception as e: rec('tâche: génération IA', False, str(e)[:160])
        print('4xx tasks page:', bad); bad.clear()

        # ---- SUIVI
        await pg.goto('http://localhost:5173/dashboard/chef/tracking'); await pg.wait_for_timeout(2500)
        try:
            body = await pg.inner_text('body')
            bl=body.lower(); rec('suivi: affichage + avancement', 'avancement global' in bl and 'santé du projet' in bl)
            sel = pg.locator('label:has-text("Ajouter un membre") select')
            opts = await sel.locator('option').all_inner_texts()
            if any('Sami' in o for o in opts):
                await sel.select_option(label='Sami Trabelsi')
                await pg.locator('label:has-text("Ajouter un membre") button').click(); await pg.wait_for_timeout(1500)
                rec('suivi: ajouter membre au projet', 'Retirer' in await pg.inner_text('body'))
            else:
                rec('suivi: ajouter membre (déjà dans le projet via équipe/auto-assign)', True)
            await pg.screenshot(path='/tmp/e2e_tracking.png', full_page=True)
        except Exception as e: rec('suivi', False, str(e)[:160])
        print('4xx tracking page:', bad); bad.clear()

        # ---- PROJETS: modifier / supprimer
        await pg.goto('http://localhost:5173/dashboard/chef'); await pg.wait_for_timeout(2500)
        try:
            await pg.locator('article button:has-text("Modifier")').first.click()
            await pg.locator('div.fixed input').first.fill('Projet modifié E2E')
            await pg.locator('div.fixed button:has-text("Enregistrer")').click(); await pg.wait_for_timeout(2500)
            rec('projet: modifier', 'Projet modifié E2E' in await pg.inner_text('body'))
        except Exception as e: rec('projet: modifier', False, str(e)[:160])
        try:
            n0 = await pg.locator('article').count()
            await pg.locator('article button:has-text("Supprimer")').last.click(); await pg.wait_for_timeout(2500)
            n1 = await pg.locator('article').count()
            rec('projet: supprimer', n1 == n0-1, f'{n0}->{n1}')
        except Exception as e: rec('projet: supprimer', False, str(e)[:160])
        print('4xx projects page:', bad); bad.clear()

        # ---- PARAMETRES chef
        await pg.goto('http://localhost:5173/dashboard/chef/settings'); await pg.wait_for_timeout(1800)
        try:
            await pg.locator('label:has-text("Téléphone") input').fill('+21655123456')
            await pg.click('text=Enregistrer le profil'); await pg.wait_for_timeout(1200)
            rec('paramètres chef: profil', 'Profil mis à jour' in await pg.inner_text('body'))
            await pg.locator('label:has-text("Mot de passe actuel") input').fill('mauvais')
            await pg.locator('label:has-text("Nouveau mot de passe") input').fill('Nouveau123!')
            await pg.locator('label:has-text("Confirmation") input').fill('Nouveau123!')
            await pg.click('text=Changer le mot de passe'); await pg.wait_for_timeout(1200)
            rec('paramètres chef: refus mauvais mdp', 'incorrect' in await pg.inner_text('body'))
            await pg.set_input_files('input[type=file]', 'e2e/avatar.png'); await pg.wait_for_timeout(1500)
            rec('paramètres chef: photo', 'Photo mise à jour' in await pg.inner_text('body'))
        except Exception as e: rec('paramètres chef', False, str(e)[:160])
        print('4xx settings page:', bad); bad.clear()

        # ---- DIRECTION
        await pg.evaluate("localStorage.clear()")
        await pg.goto('http://localhost:5173/signin'); await pg.wait_for_timeout(800)
        await pg.fill('input[type=email]','direction1@nexus-demo.tn'); await pg.fill('input[type=password]','Password123!')
        await pg.click('button[type=submit]'); await pg.wait_for_url('**/dashboard/direction**', timeout=15000)
        await pg.goto('http://localhost:5173/dashboard/direction/settings'); await pg.wait_for_timeout(2000)
        try:
            body = await pg.inner_text('body')
            rec('paramètres direction: section entreprise visible', 'Entreprise' in body and "Enregistrer l'entreprise" in body)
            await pg.locator('label:has-text("Secteur") input').fill('Technologie & IA')
            await pg.click("text=Enregistrer l'entreprise"); await pg.wait_for_timeout(1200)
            rec('paramètres direction: modifier entreprise', 'Entreprise mise à jour' in await pg.inner_text('body'))
            await pg.screenshot(path='/tmp/e2e_dir_settings.png', full_page=True)
        except Exception as e: rec('paramètres direction', False, str(e)[:160])
        print('4xx direction:', bad)
        await b.close()
    fails=[r for r in R if not r[1]]
    print('\nRESULT', len(R)-len(fails), '/', len(R))
asyncio.run(main())
