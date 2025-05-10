<template>
  <div class="loading-animation-container">
    <div class="loading-text">AI思考中</div>
    <div class="dots-container">
      <div class="dot" v-for="i in 3" :key="i" :ref="`dot${i}`"></div>
    </div>
    <div class="thinking-animation">
      <div class="thinking-circle" v-for="i in 5" :key="i" :ref="`circle${i}`"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import anime from 'animejs/lib/anime.es.js';

export default {
  name: 'LoadingAnimation',
  setup() {
    const dotsAnimation = ref(null);
    const thinkingAnimation = ref(null);
    
    onMounted(() => {
      // 初始化点动画
      dotsAnimation.value = anime({
        targets: '.dot',
        translateY: [0, -10, 0],
        opacity: [0.4, 1, 0.4],
        scale: [0.8, 1.2, 0.8],
        delay: anime.stagger(120),
        duration: 1200,
        loop: true,
        easing: 'easeInOutSine'
      });
      
      // 初始化思考圆圈动画
      thinkingAnimation.value = anime({
        targets: '.thinking-circle',
        scale: [0, 1.2, 0],
        opacity: [0, 0.8, 0],
        borderRadius: ['50%', '50%'],
        translateX: function(el, i) {
          return anime.random(-30, 30);
        },
        translateY: function(el, i) {
          return anime.random(-20, 20);
        },
        delay: anime.stagger(200),
        duration: 2000,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    });
    
    onBeforeUnmount(() => {
      // 清理动画
      if (dotsAnimation.value) {
        dotsAnimation.value.pause();
      }
      if (thinkingAnimation.value) {
        thinkingAnimation.value.pause();
      }
    });
    
    return {};
  }
};
</script>

<style scoped>
.loading-animation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  height: 100px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--md-primary-main);
  letter-spacing: 1px;
}

.dots-container {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  background-color: var(--md-primary-main);
  border-radius: 50%;
  opacity: 0.4;
}

.thinking-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.thinking-circle {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: transparent;
  border: 2px solid var(--md-primary-main);
  border-radius: 50%;
  opacity: 0;
}
</style>
