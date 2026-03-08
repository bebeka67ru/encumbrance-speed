const MODULE_ID = "encumbrance-speed";

// Добавляем два статусных эффекта с изменениями скорости
Hooks.once("init", () => {
  // Эффект "Замедлен" (множитель 0.5)
  const encumberedEffect = {
    id: "encumbered",
    label: "Encumbered (Slowed)",
    icon: `modules/${MODULE_ID}/icons/encumbered.svg`,
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" }
    ]
  };

  // Эффект "Перегружен" (множитель 0)
  const overencumberedEffect = {
    id: "overencumbered",
    label: "Overencumbered (Immobile)",
    icon: `modules/${MODULE_ID}/icons/overencumbered.svg`,
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0" },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0" },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0" },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0" },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0" }
    ]
  };

  // Добавляем эффекты в список доступных статусов
  CONFIG.statusEffects = CONFIG.statusEffects.concat([encumberedEffect, overencumberedEffect]);
});

// Основная логика обновления состояния
async function updateEncumbranceForActor(actor) {
  // Работаем только с персонажами (можно убрать, если нужно и для NPC)
  if (actor?.type !== "character") return;

  const enc = actor.system.attributes?.encumbrance;
  if (!enc || enc.max <= 0) return;

  const ratio = enc.value / enc.max;
  let multiplier = 1.0;
  if (ratio >= 1.0) multiplier = 0.0;
  else if (ratio > 0.66) multiplier = 0.5;

  // Устанавливаем статусные эффекты
  await actor.toggleStatusEffect("encumbered", { active: multiplier === 0.5 });
  await actor.toggleStatusEffect("overencumbered", { active: multiplier === 0.0 });
}

// События, при которых нужно пересчитать состояние
Hooks.on("updateActor", (actor) => updateEncumbranceForActor(actor));
Hooks.on("createItem", (item) => updateEncumbranceForActor(item.parent));
Hooks.on("updateItem", (item) => updateEncumbranceForActor(item.parent));
Hooks.on("deleteItem", (item) => updateEncumbranceForActor(item.parent));

// При готовности мира обновляем всех подходящих акторов
Hooks.on("ready", () => {
  for (const actor of game.actors.values()) {
    updateEncumbranceForActor(actor);
  }
});