/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 *
 * @author Lete114
 * @description Display the health status of the entity
 * @license GPL-2.0
 */

import { world, system, Entity, EntityHealthComponent, Player } from '@minecraft/server'
import { color, calcGameTicks } from '@mcbe-mods/utils'

system.runInterval(() => {
  world.getAllPlayers().forEach((player) => {
    const entities = player.getEntitiesFromViewDirection()
    entities.forEach((entityRaycastHit) => {
      const entity = backwardsCompatible(entityRaycastHit, ['entity'], entityRaycastHit) as Entity
      showHealth(player, entity)
    })
  })
}, calcGameTicks(500))

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

    if (health && backwardsCompatible(health, ['effectiveMax', 'value'])) {
      const maxHealth = Math.floor(backwardsCompatible(health, ['effectiveMax', 'value']) as number)

      const currentHealth = Math.floor(backwardsCompatible(health, ['currentValue', 'current']) as number)

      const PHNumber = `${color.green(maxHealth + '')}${color.reset('')} / ${color.red(currentHealth + '')}`
      player.onScreenDisplay.setActionBar(maxHealth > 100 ? PHNumber : getHeartBar(maxHealth, currentHealth))
    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function backwardsCompatible<T extends Record<string, any>>(
  obj: T,
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any
): T[keyof T] | undefined {
  for (const key of keys) {
    if (key in obj) return obj[key]
  }
  return defaultValue
}
