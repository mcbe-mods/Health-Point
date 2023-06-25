/**
 *
 * @author Lete114
 * @description Display the health status of the entity
 * @license GPL-2.0
 */

import { world, system, Player, Entity, DynamicPropertiesDefinition, MinecraftEntityTypes } from '@minecraft/server'

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
    entities.forEach((entity) => {
      showHealth(player, entity)
    })
  })
})

world.afterEvents.entityHurt.subscribe((e) => {
  showHealth(e.damageSource.damagingEntity, e.hurtEntity)
})

/**
 *
 * @param {Player} player
 * @param {Entity} entity
 */
function showHealth(player, entity) {
  try {
    const health = entity.getComponent('health')

    if (!health?.value) return

    /** @type {number} */
    const maxHealth = health.value
    /** @type {number} */
    const currentHealth = health.current

    const togglePHType = player.getDynamicProperty(PH)
    const PHBar = togglePHType ? `§a${maxHealth} §r/ §c${currentHealth}` : getHeartBar(maxHealth, currentHealth)

    player.onScreenDisplay.setActionBar(PHBar)
  } catch (error) {
    console.log(error)
  }
}

/**
 *
 * @param {number} maxHealth
 * @param {number} currentHealth
 * @returns
 */
function getHeartBar(maxHealth, currentHealth) {
  const heart = '\u2764'
  const color = ['§c', '§8']

  const currentHeart = color[0] + heart.repeat(currentHealth)
  const injured = color[1] + heart.repeat(maxHealth - currentHealth)
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
  const reg = new RegExp(color[1] + '$', 'g')
  return '§c' + result.replace(reg, '').trim()
}
