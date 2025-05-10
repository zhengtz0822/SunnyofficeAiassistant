<template>
  <div class="animated-loading">
    <div class="dots-wrapper">
      <div class="dot" v-for="n in 3" :key="n" ref="dots"></div>
    </div>
    <div class="pulse-wrapper">
      <div class="pulse" ref="pulse"></div>
    </div>
    <div class="thinking-text">AI思考中...</div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import anime from 'animejs/lib/anime.es.js';

export default {
  name: 'AnimatedLoading',
  setup() {
    const dots = ref([]);
    const pulse = ref(null);
    let dotsAnimation = null;
    let pulseAnimation = null;

    onMounted(() => {
      // 点的动画
      dotsAnimation = anime({
        targets: dots.value,
        translateY: [0, -12, 0],
        opacity: [0.3, 1, 0.3],
        scale: [0.8, 1.2, 0.8],
        duration: 1200,
        loop: true,
        delay: anime.stagger(180),
        easing: 'easeInOutSine'
      });

      // 脉冲动画
      pulseAnimation = anime({
        targets: pulse.value,
        scale: [0.8, 1.2, 0.8],
        opacity: [0.2, 0.5, 0.2],
        duration: 2000,
        loop: true,
        easing: 'easeInOutSine'
      });
    });

    onBeforeUnmount(() => {
      if (dotsAnimation) dotsAnimation.pause();
      if (pulseAnimation) pulseAnimation.pause();
    });

    return {
      dots,
      pulse
    };
  }
};
</script>

<style scoped>
.animated-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  width: 100%;
  height: 100px;
}

.dots-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  background-color: var(--el-color-primary, #409EFF);
  border-radius: 50%;
}

.pulse-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
}

.pulse {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0) 70%);
  border-radius: 50%;
}

.thinking-text {
  font-size: 14px;
  color: var(--el-color-primary, #409EFF);
  margin-top: 10px;
  font-weight: 500;
}
</style>
