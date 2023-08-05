/**
 *
 * @author Lete114
 * @description Display the health status of the entity
 * @license GPL-2.0
 */

import { world, system, DynamicPropertiesDefinition, MinecraftEntityTypes, Entity } from '@minecraft/server'
import type { EntityHealthComponent, Player } from '@minecraft/server'
import { color } from '@mcbe-mods/utils'

const PH = 'Hit Point'

world.afterEvents.worldInitialize.subscribe((e) => {
  const dpd = new DynamicPropertiesDefinition()
  dpd.defineBoolean(PH)
  e.propertyRegistry.registerEntityTypeDynamicProperties(dpd, MinecraftEntityTypes.player)
})

world.beforeEvents.chatSend.subscribe(async (e) => {
  const msg = e.message
  if (/#PH#/i.test(msg)) {
    e.cancel = true
    const player = e.sender
    const ph = player.getDynamicProperty(PH)
    player.setDynamicProperty(PH, !ph)
  }
})

system.runInterval(() => {
  world.getAllPlayers().forEach((player) => {
    const entities = player.getEntitiesFromViewDirection()
    entities.forEach((entityRaycastHit) => {
      showHealth(player, entityRaycastHit.entity)
    })
  })
})

world.afterEvents.entityHurt.subscribe((e) => {
  showHealth(e.damageSource.damagingEntity as Player, e.hurtEntity)
})

/**
 *
 * @param {Player} player
 * @param {Entity} entity
 */
function showHealth(player: Player, entity: Entity) {
  try {
    const health = entity.getComponent('health') as EntityHealthComponent

    if (!health?.effectiveMax) return

    /** @type {number} */
    const maxHealth = Math.floor(health.effectiveMax)
    /** @type {number} */
    const currentHealth = Math.floor(health.currentValue)

    const togglePHType = player.getDynamicProperty(PH)
    const PHBar = togglePHType
      ? `${color.green(maxHealth + '')}${color.reset('')} / ${color.red(currentHealth + '')}`
      : getHeartBar(maxHealth, currentHealth)

    player.onScreenDisplay.setActionBar(PHBar)
  } catch (error) {
    /* eslint-disable no-console , @typescript-eslint/no-explicit-any*/
    console.log(error)
    console.log((error as any).message)
    console.log((error as any).stack)
    /* eslint-enable */
  }
}

/**
 *
 * @param {number} maxHealth
 * @param {number} currentHealth
 * @returns
 */
function getHeartBar(maxHealth: number, currentHealth: number) {
  const heart = '\u2764'

  const currentHeart = color.red(heart.repeat(currentHealth))
  const injured = color.darkGray(heart.repeat(maxHealth - currentHealth))
  const text = currentHeart + injured

  let result = '',
    _tmp = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    _tmp += char

    // Every 20 hearts for a row of blood
    const _reg = new RegExp(heart, 'g')
    if (_tmp.match(_reg)?.length === 20) {
      result += _tmp + '\n'
      // Clear to recount the next row of blood
      _tmp = ''
    } else if (i === text.length - 1) {
      // If the final 20 hearts are not met then directly splice
      result += _tmp
    }
  }
  const reg = new RegExp(`${color.darkGray('')}$`)
  return result.replace(reg, '').trim()
}
